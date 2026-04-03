import type {
	ActiveAssetData,
	AssetMeta,
	FundingPayment,
	HistoricalOrder,
	MarginSummary,
	OpenOrder,
	Position,
	UserBalance,
	UserFill,
} from '@/normalizer/types';
import { fetchBalance } from './services/balance-api';
import { fetchPositions } from './services/positions-api';
import { fetchOpenOrders } from './services/orders-api';
import { fetchOrderHistory } from './services/order-history-api';
import { fetchUserTrades } from './services/trades-api';
import { fetchFundingHistory } from './services/funding-api';
import { fetchLeverage } from './services/leverage-api';
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
	ExtL2Config,
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
export const assetPrecisionMap = new Map<string, number>();
const collateralPrecisionMap = new Map<string, number>();
export const l2ConfigMap = new Map<string, ExtL2Config>();
export const tradingConfigMap = new Map<
	string,
	{
		minPriceChange: string;
		minOrderSizeChange: string;
		maxPositionValue: string;
		minOrderSize: string;
		limitPriceCap: string;
	}
>();

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
		methods: ['bridge-usdc', 'card'],
		chainId: 42161, // Default to Arbitrum (user can pick chain)
		tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
		tokenSymbol: 'USDC',
		tokenDecimals: 6,
		minDeposit: 5,
		fee: 0, // Dynamic from bridge quote
		bridgeAddress: '', // Dynamic from /bridge/config
		estimatedTime: '~2 min',
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
		l2ConfigMap.clear();
		tradingConfigMap.clear();
		setAssetNames(result.data);

		for (const market of result.data) {
			if (!market.active || market.status !== 'ACTIVE') continue;

			assetPrecisionMap.set(market.name, market.assetPrecision);
			collateralPrecisionMap.set(market.name, market.collateralAssetPrecision);

			if (market.l2Config) {
				l2ConfigMap.set(market.name, market.l2Config);
			}

			tradingConfigMap.set(market.name, {
				minPriceChange: market.tradingConfig.minPriceChange,
				minOrderSizeChange: market.tradingConfig.minOrderSizeChange,
				maxPositionValue: market.tradingConfig.maxPositionValue,
				minOrderSize: market.tradingConfig.minOrderSize,
				limitPriceCap: market.tradingConfig.limitPriceCap ?? '0.1',
			});

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

	calculatePriceDecimals: (_value, coin) => {
		const config = tradingConfigMap.get(coin);
		if (config) {
			const dotIndex = config.minPriceChange.indexOf('.');
			if (dotIndex !== -1) return config.minPriceChange.length - dotIndex - 1;
		}
		const maxDecimals = collateralPrecisionMap.get(coin) ?? 6;
		return calculatePriceDecimals(_value, maxDecimals);
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

	// ── REST Polling (private user data) ──

	async fetchUserData(walletAddress) {
		const [extBalance, extPositions, extOrders] = await Promise.all([
			fetchBalance(walletAddress),
			fetchPositions(walletAddress),
			fetchOpenOrders(walletAddress),
		]);

		const balance: MarginSummary | null = extBalance
			? {
					accountValue: extBalance.equity,
					totalMarginUsed: extBalance.initialMargin,
					crossMaintenanceMarginUsed: '0',
					withdrawable: extBalance.availableForTrade,
					totalRawUsd: extBalance.equity,
				}
			: null;

		const positions: Position[] = extPositions.map((extPosition) => {
			// Initial margin = value / leverage (what Extended displays as "Margin")
			const value = parseFloat(extPosition.value);
			const leverage = parseFloat(extPosition.leverage);
			const initialMargin = leverage > 0 ? value / leverage : 0;

			return {
				coin: extPosition.market,
				size: extPosition.size,
				side: extPosition.side,
				entryPrice: extPosition.openPrice,
				unrealizedPnl: extPosition.unrealisedPnl,
				leverage: extPosition.leverage,
				liquidationPrice: extPosition.liquidationPrice,
				marginUsed: initialMargin.toFixed(6),
				funding: '',
				tp: extPosition.tpTriggerPrice
					? parseFloat(extPosition.tpTriggerPrice)
					: null,
				sl: extPosition.slTriggerPrice
					? parseFloat(extPosition.slTriggerPrice)
					: null,
			};
		});

		const perpsBalances: UserBalance[] = extBalance
			? [
					{
						coin: 'USDC',
						totalBalance: extBalance.balance,
						availableBalance: extBalance.availableForTrade,
						usdValue: parseFloat(extBalance.equity),
						pnl: parseFloat(extBalance.unrealisedPnl),
						roi: 0,
						type: 'perps',
					},
				]
			: [];

		const openOrders: OpenOrder[] = extOrders.map((extOrder) => {
			const isTpsl = extOrder.type === 'TPSL';
			const isTp = !!extOrder.takeProfit && !extOrder.stopLoss;
			const isSl = !!extOrder.stopLoss && !extOrder.takeProfit;

			let orderType: OpenOrder['orderType'] = 'limit';
			if (extOrder.type === 'CONDITIONAL') {
				orderType =
					extOrder.trigger?.executionPriceType === 'MARKET'
						? 'sl_market'
						: 'sl';
			} else if (isTpsl || isTp) {
				orderType = 'tp_market';
			} else if (isSl) {
				orderType = 'sl_market';
			}

			return {
				id: String(extOrder.id),
				coin: extOrder.market,
				side: extOrder.side === 'BUY' ? ('buy' as const) : ('sell' as const),
				price: parseFloat(extOrder.price),
				size: parseFloat(extOrder.qty),
				origSize: parseFloat(extOrder.qty),
				filledSize: parseFloat(extOrder.filledQty ?? '0'),
				isReduceOnly: extOrder.reduceOnly,
				orderType,
				triggerPrice: extOrder.trigger
					? parseFloat(extOrder.trigger.triggerPrice)
					: null,
				triggerCondition: extOrder.trigger?.triggerPriceDirection ?? null,
				tp: extOrder.takeProfit
					? parseFloat(extOrder.takeProfit.triggerPrice)
					: null,
				sl: extOrder.stopLoss
					? parseFloat(extOrder.stopLoss.triggerPrice)
					: null,
				status:
					extOrder.status === 'PARTIALLY_FILLED'
						? ('partial' as const)
						: ('open' as const),
				timestamp: extOrder.createdTime,
				isPositionTpsl: isTpsl && extOrder.tpSlType === 'POSITION',
				tif: extOrder.timeInForce,
				cloid: extOrder.externalId,
			};
		});

		return { balance, positions, openOrders, perpsBalances };
	},

	async fetchUserLeverage(walletAddress, market) {
		return fetchLeverage(walletAddress, market);
	},

	async fetchOrderHistory(
		walletAddress: string,
		limit = 50,
	): Promise<HistoricalOrder[]> {
		const orders = await fetchOrderHistory(walletAddress, limit);
		return orders.map((extOrder) => ({
			id: String(extOrder.id),
			coin: extOrder.market,
			side: extOrder.side === 'BUY' ? ('buy' as const) : ('sell' as const),
			orderType: extOrder.type.toLowerCase(),
			dir: extOrder.reduceOnly
				? extOrder.side === 'BUY'
					? 'Close Short'
					: 'Close Long'
				: extOrder.side === 'BUY'
					? 'Open Long'
					: 'Open Short',
			price: parseFloat(extOrder.price),
			size: parseFloat(extOrder.qty),
			filledSize: parseFloat(extOrder.filledQty ?? '0'),
			origSize: parseFloat(extOrder.qty),
			status: extOrder.status.toLowerCase(),
			reduceOnly: extOrder.reduceOnly,
			triggerCondition: extOrder.trigger?.triggerPriceDirection ?? null,
			tp: extOrder.takeProfit
				? parseFloat(extOrder.takeProfit.triggerPrice)
				: null,
			sl: extOrder.stopLoss ? parseFloat(extOrder.stopLoss.triggerPrice) : null,
			timestamp: extOrder.createdTime,
			statusTimestamp: extOrder.updatedTime,
		}));
	},

	async fetchFundingHistory(walletAddress: string): Promise<FundingPayment[]> {
		const payments = await fetchFundingHistory(walletAddress);
		return payments.map((payment) => ({
			time: payment.paidTime,
			coin: payment.market,
			usdc: parseFloat(payment.fundingFee),
			size: parseFloat(payment.size),
			fundingRate: parseFloat(payment.fundingRate),
			side: payment.side === 'LONG' ? ('Long' as const) : ('Short' as const),
		}));
	},

	async fetchUserFills(walletAddress, limit = 50): Promise<UserFill[]> {
		const trades = await fetchUserTrades(walletAddress, limit);
		return trades.map((trade) => ({
			id: String(trade.id),
			coin: trade.market,
			side: trade.side === 'BUY' ? ('buy' as const) : ('sell' as const),
			dir:
				trade.tradeType === 'LIQUIDATION' || trade.tradeType === 'DELEVERAGE'
					? trade.side === 'BUY'
						? 'Close Short'
						: 'Close Long'
					: trade.side === 'BUY'
						? 'Open Long'
						: 'Open Short',
			price: parseFloat(trade.price),
			size: parseFloat(trade.qty),
			closedPnl: 0,
			fee: parseFloat(trade.fee),
			feeToken: 'USDC',
			crossed: trade.isTaker,
			hash: '',
			time: trade.createdTime,
		}));
	},
};
