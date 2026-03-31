import type {
	Bar,
	DatafeedConfiguration,
	DatafeedErrorCallback,
	HistoryCallback,
	IDatafeedChartApi,
	IExternalDatafeed,
	LibrarySymbolInfo,
	OnReadyCallback,
	PeriodParams,
	ResolveCallback,
	ResolutionString,
	SearchSymbolsCallback,
	SubscribeBarsCallback,
} from '@charting_library/datafeed-api';
import type { Candle } from '@/normalizer/types';
import type { DexNormalizer } from '@/normalizer/normalizer';
import type { TradingWebSocket } from '@/services/websocket';
import {
	SUPPORTED_RESOLUTIONS,
	tvResolutionToHlInterval,
} from './resolution-map';

function parseAndTrack(
	raw: unknown,
	normalizer: DexNormalizer,
	trackTime: (time: number) => void,
): Bar {
	const candle: Candle = normalizer.parseCandle(raw);
	trackTime(candle.time);
	return candle;
}

const CONFIG: DatafeedConfiguration = {
	supported_resolutions: SUPPORTED_RESOLUTIONS,
	supports_marks: false,
	supports_timescale_marks: false,
	supports_time: false,
};

export interface DatafeedWithDispose {
	datafeed: IExternalDatafeed & IDatafeedChartApi;
	dispose: () => void;
	fillGap: () => Promise<void>;
}

export function createDatafeed(
	normalizer: DexNormalizer,
	ws: TradingWebSocket,
	getPrice: (coin: string) => number,
): DatafeedWithDispose {
	const subscriptions = new Map<string, () => void>();

	let activeOnTick: SubscribeBarsCallback | null = null;
	let activeCoin: string | null = null;
	let activeInterval: string | null = null;
	let lastBarTime = 0;
	let gapFillInProgress = false;

	const datafeed: IExternalDatafeed & IDatafeedChartApi = {
		onReady(callback: OnReadyCallback) {
			setTimeout(() => callback(CONFIG), 0);
		},

		searchSymbols(
			_userInput: string,
			_exchange: string,
			_symbolType: string,
			onResult: SearchSymbolsCallback,
		) {
			onResult([]);
		},

		resolveSymbol(
			symbolName: string,
			onResolve: ResolveCallback,
			onError: DatafeedErrorCallback,
		) {
			setTimeout(() => {
				try {
					const price = getPrice(symbolName);
					const decimals = normalizer.calculatePriceDecimals(price, symbolName);
					const pricescale = Math.pow(10, decimals);

					const symbolInfo: LibrarySymbolInfo = {
						name: symbolName,
						ticker: symbolName,
						description: symbolName,
						type: 'crypto',
						session: '24x7',
						timezone: 'Etc/UTC',
						exchange: normalizer.name,
						listed_exchange: normalizer.name,
						format: 'price',
						minmov: 1,
						pricescale,
						volume_precision: 2,
						has_intraday: true,
						has_daily: true,
						has_weekly_and_monthly: true,
						supported_resolutions: SUPPORTED_RESOLUTIONS,
						data_status: 'streaming',
					};

					onResolve(symbolInfo);
				} catch (e) {
					onError(e instanceof Error ? e.message : 'Failed to resolve symbol');
				}
			}, 0);
		},

		async getBars(
			symbolInfo: LibrarySymbolInfo,
			resolution: ResolutionString,
			periodParams: PeriodParams,
			onResult: HistoryCallback,
			onError: DatafeedErrorCallback,
		) {
			try {
				const { from, to } = periodParams;
				const interval = tvResolutionToHlInterval(resolution);
				const coin = symbolInfo.ticker ?? symbolInfo.name;

				const candles = await normalizer.fetchCandles(
					coin,
					interval,
					from * 1000,
					to * 1000,
				);

				if (candles.length === 0) {
					onResult([], { noData: true });
					return;
				}

				lastBarTime = Math.max(lastBarTime, candles[candles.length - 1].time);
				onResult(candles, { noData: false });
			} catch (e) {
				onError(e instanceof Error ? e.message : 'Failed to fetch bars');
			}
		},

		subscribeBars(
			symbolInfo: LibrarySymbolInfo,
			resolution: ResolutionString,
			onTick: SubscribeBarsCallback,
			listenerGuid: string,
		) {
			const interval = tvResolutionToHlInterval(resolution);
			const coin = symbolInfo.ticker ?? symbolInfo.name;
			const channel = normalizer.channels.candles(coin, interval);

			activeOnTick = onTick;
			activeCoin = coin;
			activeInterval = interval;

			const unsub = ws.subscribe(channel, (raw) => {
				const bar = parseAndTrack(raw, normalizer, (t) => {
					lastBarTime = Math.max(lastBarTime, t);
				});
				onTick(bar);
			});

			subscriptions.set(listenerGuid, unsub);
		},

		unsubscribeBars(listenerGuid: string) {
			const unsub = subscriptions.get(listenerGuid);
			if (unsub) {
				unsub();
				subscriptions.delete(listenerGuid);
			}
			activeOnTick = null;
			activeCoin = null;
			activeInterval = null;
		},
	};

	return {
		datafeed,

		dispose() {
			for (const unsub of subscriptions.values()) unsub();
			subscriptions.clear();
			activeOnTick = null;
			activeCoin = null;
			activeInterval = null;
		},

		async fillGap() {
			if (gapFillInProgress) return;
			if (!activeOnTick || !activeCoin || !activeInterval || !lastBarTime)
				return;

			const onTick = activeOnTick;
			const coin = activeCoin;
			const interval = activeInterval;

			gapFillInProgress = true;

			const channel = normalizer.channels.candles(coin, interval);
			ws.startBuffering(channel);

			try {
				const candles = await normalizer.fetchCandles(
					coin,
					interval,
					lastBarTime,
					Date.now(),
				);

				if (activeOnTick !== onTick) return;

				for (const candle of candles) {
					lastBarTime = Math.max(lastBarTime, candle.time);
					onTick(candle);
				}
			} finally {
				const buffered = ws.flushBuffer(channel);
				if (activeOnTick === onTick) {
					for (const raw of buffered) {
						const bar = parseAndTrack(raw, normalizer, (t) => {
							lastBarTime = Math.max(lastBarTime, t);
						});
						onTick(bar);
					}
				}
				gapFillInProgress = false;
			}
		},
	};
}
