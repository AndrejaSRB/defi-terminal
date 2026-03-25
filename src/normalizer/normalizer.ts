import type {
	ActiveAssetData,
	AggregationLevel,
	AssetMeta,
	Candle,
	HistoricalOrder,
	OpenOrder,
	OrderBook,
	Position,
	Prices,
	Trade,
	UserBalance,
	UserFill,
	FundingPayment,
	MarginSummary,
	UserTradingContext,
} from './types';

// ── Channel Descriptor ───────────────────────────────────────────────
// Generic — each DEX defines its own shapes internally and casts.
// Only `type` is required at the interface level.

export interface ChannelDescriptor {
	type: string;
	[key: string]: unknown;
}

// ── Parsed WS Message ────────────────────────────────────────────────
export interface ParsedWsMessage {
	channel: string;
	payload: unknown;
}

// ── Protocol Hooks ───────────────────────────────────────────────────
// The contract the WebSocket class depends on. Assembled from normalizer
// methods in ws.ts — WebSocket never imports DexNormalizer directly.

export interface ProtocolHooks {
	channelKey: (descriptor: ChannelDescriptor) => string;
	formatSubscribe: (descriptor: ChannelDescriptor) => object;
	formatUnsubscribe: (descriptor: ChannelDescriptor) => object;
	parseMessage: (raw: unknown) => ParsedWsMessage | null;
	deserialize: (data: unknown) => unknown;
	formatPing: () => object;
	isPong: (message: unknown) => boolean;
}

// ── Format Options ───────────────────────────────────────────────────
export interface FormatPriceOptions {
	hasDollarSign?: boolean;
}

// ── Dex Normalizer ───────────────────────────────────────────────────
export interface DexNormalizer {
	name: string;

	// Lifecycle
	init: () => Promise<Map<string, AssetMeta>>;

	// Aggregation levels for order book
	getAggregationLevels: (midPrice: number) => AggregationLevel[];

	// Channel descriptor factories
	channels: {
		prices: () => ChannelDescriptor;
		orderBook: (coin: string, agg?: AggregationLevel) => ChannelDescriptor;
		trades: (coin: string) => ChannelDescriptor;
		activeAsset: (coin: string) => ChannelDescriptor;
		candles: (coin: string, interval: string) => ChannelDescriptor;
		userPositions: (address: string) => ChannelDescriptor;
		userOpenOrders: (address: string) => ChannelDescriptor;
		allAssetCtxs?: () => ChannelDescriptor;
		userFills?: (address: string) => ChannelDescriptor;
		userBalances?: (address: string) => ChannelDescriptor;
		spotState?: (address: string) => ChannelDescriptor;
		userFundings?: (address: string) => ChannelDescriptor;
		userHistoricalOrders?: (address: string) => ChannelDescriptor;
		userTradingContext?: (address: string, coin: string) => ChannelDescriptor;
	};

	// Protocol — used by hooks and assembled into ProtocolHooks for WS
	channelKey: (descriptor: ChannelDescriptor) => string;
	formatSubscribe: (descriptor: ChannelDescriptor) => object;
	formatUnsubscribe: (descriptor: ChannelDescriptor) => object;
	parseWsMessage: (raw: unknown) => ParsedWsMessage | null;

	// Formatting — DEX-specific, uses internal metadata
	formatPrice: (
		value: number,
		coin: string,
		options?: FormatPriceOptions,
	) => string;
	formatSize: (value: number, coin: string) => string;
	calculatePriceDecimals: (value: number, coin: string) => number;

	// Message parsers — raw WS payload → canonical types
	parseOrderBook: (raw: unknown) => OrderBook;
	parsePrices: (raw: unknown) => Prices;
	parseTrades: (raw: unknown) => Trade[];
	parseActiveAsset: (raw: unknown) => ActiveAssetData;
	parseUserPositions: (raw: unknown) => Position[];
	parseUserOpenOrders: (raw: unknown) => OpenOrder[];
	parseCandles: (raw: unknown) => Candle[];
	parseCandle: (raw: unknown) => Candle;
	parseAllAssetCtxs?: (raw: unknown) => Map<string, ActiveAssetData>;
	parseUserFills?: (raw: unknown) => UserFill[];
	parseUserBalances?: (raw: unknown) => {
		margin: MarginSummary;
		balances: UserBalance[];
	};
	parseSpotBalances?: (raw: unknown) => UserBalance[];
	parseUserFundings?: (raw: unknown) => FundingPayment[];
	parseHistoricalOrders?: (raw: unknown) => HistoricalOrder[];
	parseUserTradingContext?: (raw: unknown) => UserTradingContext;

	// REST snapshot fetchers
	fetchOrderBook: (coin: string, agg?: AggregationLevel) => Promise<OrderBook>;
	fetchTrades: (coin: string, limit?: number) => Promise<Trade[]>;
	fetchCandles: (
		coin: string,
		interval: string,
		startTime?: number,
		endTime?: number,
	) => Promise<Candle[]>;
	fetchAllAssetCtxs: () => Promise<Map<string, ActiveAssetData>>;
	fetchUserFills?: (address: string, limit?: number) => Promise<UserFill[]>;
}
