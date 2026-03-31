import type { ActiveAssetData, AssetMeta } from '@/normalizer/types';
import type {
	ChannelDescriptor,
	DexNormalizer,
	ParsedWsMessage,
} from '@/normalizer/normalizer';
import { OrderBookAccumulator } from '@/normalizer/orderbook-accumulator';
import type {
	ExtMarketsResponse,
	ExtOrderBookResponse,
	ExtTradesResponse,
	ExtCandlesResponse,
} from './types/api';
import {
	parseOrderBook,
	parseRestOrderBook,
	parseTrades,
	parseRestTrades,
	parseCandles,
	parseCandle,
	parseMarkPrice,
	marketToActiveAsset,
} from './utils/parser';
import {
	calculatePriceDecimals,
	formatPrice,
	formatSize,
} from './utils/format';
import { getAggregationLevels } from './utils/aggregation';
import { extGetTokenImageUrl, setAssetNames } from './utils/token-images';
import { extTokenCategories } from './utils/token-categories';
import { EXTENDED_CONFIG } from './config';

// Module-level caches — populated by init()
const assetPrecisionMap = new Map<string, number>();
const collateralPrecisionMap = new Map<string, number>();

async function fetchJson<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(
			`Extended API error: ${response.status} ${response.statusText}`,
		);
	}
	return response.json() as Promise<T>;
}

// ── Interval Mapping ──
// Datafeed passes HL-style intervals (1m, 1h, 1d).
// Extended API uses ISO 8601 durations (PT1M, PT1H, P1D).

const INTERVAL_TO_ISO: Record<string, string> = {
	'1m': 'PT1M',
	'3m': 'PT3M',
	'5m': 'PT5M',
	'15m': 'PT15M',
	'30m': 'PT30M',
	'1h': 'PT1H',
	'2h': 'PT2H',
	'4h': 'PT4H',
	'8h': 'PT8H',
	'12h': 'PT12H',
	'1d': 'P1D',
	'3d': 'P3D',
	'1w': 'P1W',
	'1M': 'P1M',
};

function toIsoInterval(interval: string): string {
	return INTERVAL_TO_ISO[interval] ?? interval;
}

// ── Channel Key ──

function extChannelKey(desc: ChannelDescriptor): string {
	const channel = desc.type;
	const market = (desc as { market?: string }).market ?? '';
	const interval = (desc as { interval?: string }).interval ?? '';
	if (interval) return `${channel}:${market}:${interval}`;
	return market ? `${channel}:${market}` : channel;
}

// ── Normalizer ──

export const extendedNormalizer: DexNormalizer = {
	name: 'Extended',
	wsUrl: EXTENDED_CONFIG.WEBSOCKET_URL,
	wsType: 'multi-stream',
	defaultToken: 'BTC-USD',
	orderBookDepth: 14,

	buildStreamUrl: (baseUrl, descriptor) => {
		const market = (descriptor as { market?: string }).market ?? '';
		const interval = (descriptor as { interval?: string }).interval ?? '';
		const channel = descriptor.type;

		switch (channel) {
			case 'orderbook':
				return `${baseUrl}/orderbooks/${market}?keepAlive=true`;
			case 'trades':
				return `${baseUrl}/publicTrades/${market}?keepAlive=true`;
			case 'mark-prices':
				return market
					? `${baseUrl}/prices/mark/${market}`
					: `${baseUrl}/prices/mark`;
			case 'candles':
				return `${baseUrl}/candles/${market}/trades?interval=${interval}&keepAlive=true`;
			default:
				return `${baseUrl}/${channel}/${market}`;
		}
	},

	depositConfig: {
		chainId: 1, // Ethereum mainnet for Starknet deposits
		tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
		tokenSymbol: 'USDC',
		tokenDecimals: 6,
		minDeposit: 10,
		fee: 0,
		bridgeAddress: '', // Will be set during onboarding
		estimatedTime: '~10 min',
	},
	withdrawConfig: {
		tokenSymbol: 'USDC',
		fee: 0,
		estimatedTime: '~30 min',
		minWithdraw: 10,
	},
	tokenCategories: extTokenCategories,
	getTokenImageUrl: extGetTokenImageUrl,

	deserialize: (data: unknown) =>
		typeof data === 'string' ? JSON.parse(data) : data,
	formatPing: () => ({ type: 'ping' }),
	isPong: (message: unknown) =>
		typeof message === 'object' &&
		message !== null &&
		(message as { type?: string }).type === 'pong',

	async init() {
		const result = await fetchJson<ExtMarketsResponse>(
			`${EXTENDED_CONFIG.REST_URL}/info/markets`,
		);

		const assetMetaMap = new Map<string, AssetMeta>();
		assetPrecisionMap.clear();
		collateralPrecisionMap.clear();
		setAssetNames(result.data);

		for (const market of result.data) {
			if (!market.active || market.status !== 'ACTIVE') continue;

			assetPrecisionMap.set(market.name, market.assetPrecision);
			collateralPrecisionMap.set(market.name, market.collateralAssetPrecision);

			assetMetaMap.set(market.name, {
				name: market.name,
				szDecimals: market.assetPrecision,
				maxLeverage: parseInt(market.tradingConfig.maxLeverage, 10),
				onlyIsolated: false,
			});
		}

		return assetMetaMap;
	},

	getAggregationLevels,

	// ── Channels ──

	channels: {
		prices: () => ({ type: 'mark-prices' }),
		orderBook: (coin) => ({ type: 'orderbook', market: coin }),
		trades: (coin) => ({ type: 'trades', market: coin }),
		candles: (coin, interval) => ({
			type: 'candles',
			market: coin,
			interval: toIsoInterval(interval),
		}),
	},

	channelKey: extChannelKey,

	formatSubscribe: (desc) => ({
		type: 'subscribe',
		channel: desc.type,
		...(desc.market ? { market: desc.market } : {}),
		...(desc.interval ? { interval: desc.interval } : {}),
	}),

	formatUnsubscribe: (desc) => ({
		type: 'unsubscribe',
		channel: desc.type,
		...(desc.market ? { market: desc.market } : {}),
		...(desc.interval ? { interval: desc.interval } : {}),
	}),

	// Extended WS messages don't have a `channel` field — multi-stream
	// delivers raw messages directly to the channelKey subscriber.
	// Return null so multi-stream uses its direct-delivery path.
	parseWsMessage: (): ParsedWsMessage | null => null,

	// ── Formatting ──

	formatPrice: (value, coin, options) => {
		const maxDecimals = collateralPrecisionMap.get(coin) ?? 6;
		const prefix = options?.hasDollarSign ? '$' : '';
		return `${prefix}${formatPrice(value, maxDecimals)}`;
	},

	formatSize: (value, coin) => {
		const precision = assetPrecisionMap.get(coin) ?? 4;
		return formatSize(value, precision);
	},

	calculatePriceDecimals: (value, coin) => {
		const maxDecimals = collateralPrecisionMap.get(coin) ?? 6;
		return calculatePriceDecimals(value, maxDecimals);
	},

	createOrderBookAccumulator: () => new OrderBookAccumulator(),

	feedOrderBook: (raw, accumulator) => {
		const msg = raw as Record<string, unknown>;
		const inner = (msg.data ?? msg) as Record<string, unknown>;
		const msgType = (inner.t ?? msg.type ?? '') as string;
		const bids = (inner.b ?? []) as { p: string; q: string; c?: string }[];
		const asks = (inner.a ?? []) as { p: string; q: string; c?: string }[];

		// `c` = absolute size, available on both SNAPSHOT and DELTA.
		// Always prefer `c` over `q` (which is a delta change for DELTA messages).
		const toAccLevels = (levels: { p: string; q: string; c?: string }[]) =>
			levels.map((level) => ({
				price: level.p,
				size: parseFloat(level.c ?? level.q),
			}));

		if (msgType === 'SNAPSHOT') {
			accumulator.applySnapshot(toAccLevels(bids), toAccLevels(asks));
		} else if (msgType === 'DELTA') {
			accumulator.applyDelta(toAccLevels(bids), toAccLevels(asks));
		}
	},

	// ── Parsers ──

	parseOrderBook,
	parsePrices: (raw) => {
		const data = parseMarkPrice(raw);
		return { [data.coin]: data.price };
	},
	parseTrades,
	// activeAsset channel not defined — header uses allAssetCtxs (REST) + prices (WS)
	parseActiveAsset: () => ({
		coin: '',
		markPrice: '0',
		oraclePrice: '0',
		prevDayPx: '0',
		volume24h: '0',
		openInterest: '0',
		fundingRate: '0',
		fundingInterval: '1h',
	}),
	parseUserPositions: () => [],
	parseUserOpenOrders: () => [],
	parseCandles,
	parseCandle,

	// ── All Asset Contexts (from REST) ──

	async fetchAllAssetCtxs() {
		const result = await fetchJson<ExtMarketsResponse>(
			`${EXTENDED_CONFIG.REST_URL}/info/markets`,
		);
		const ctxMap = new Map<string, ActiveAssetData>();

		for (const market of result.data) {
			if (!market.active || market.status !== 'ACTIVE') continue;
			ctxMap.set(market.name, marketToActiveAsset(market));
		}

		return ctxMap;
	},

	// ── REST Fetchers ──

	async fetchOrderBook(coin) {
		const result = await fetchJson<ExtOrderBookResponse>(
			`${EXTENDED_CONFIG.REST_URL}/info/markets/${coin}/orderbook`,
		);
		return parseRestOrderBook(result.data);
	},

	async fetchTrades(coin, limit = 50) {
		const result = await fetchJson<ExtTradesResponse>(
			`${EXTENDED_CONFIG.REST_URL}/info/markets/${coin}/trades?limit=${limit}`,
		);
		return parseRestTrades(result.data);
	},

	async fetchCandles(coin, interval, _startTime, endTime) {
		const params = new URLSearchParams({
			interval: toIsoInterval(interval),
			limit: '300',
		});
		if (endTime) params.set('endTime', endTime.toString());

		const result = await fetchJson<ExtCandlesResponse>(
			`${EXTENDED_CONFIG.REST_URL}/info/candles/${coin}/trades?${params}`,
		);
		return parseCandles(result.data);
	},

	estimateLiquidationPrice: ({ side, entryPrice, leverage }) => {
		const maintenanceMargin = 0.03;
		if (side === 'long') {
			return entryPrice * (1 - (1 / leverage - maintenanceMargin));
		}
		return entryPrice * (1 + (1 / leverage - maintenanceMargin));
	},
};
