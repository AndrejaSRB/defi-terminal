// ── Order Book ───────────────────────────────────────────────────────
export interface OrderBookLevel {
	price: number;
	size: number;
}

export interface OrderBook {
	bids: OrderBookLevel[];
	asks: OrderBookLevel[];
	timestamp: number;
}

// ── Trades ───────────────────────────────────────────────────────────
export interface Trade {
	id: string;
	coin: string;
	side: 'buy' | 'sell';
	price: number;
	size: number;
	timestamp: number;
}

// ── Candles ──────────────────────────────────────────────────────────
export interface Candle {
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

// ── Positions ────────────────────────────────────────────────────────
export interface Position {
	coin: string;
	size: string;
	side: 'LONG' | 'SHORT';
	entryPrice: string;
	unrealizedPnl: string;
	leverage: string;
	liquidationPrice: string | null;
	marginUsed: string;
	funding: string;
	tp: number | null;
	sl: number | null;
}

// ── Open Orders ──────────────────────────────────────────────────────
export type OrderType =
	| 'limit'
	| 'market'
	| 'tp'
	| 'sl'
	| 'tp_market'
	| 'sl_market';

export interface OpenOrder {
	id: string;
	coin: string;
	side: 'buy' | 'sell';
	price: number;
	size: number;
	origSize: number;
	filledSize: number;
	isReduceOnly: boolean;
	orderType: OrderType;
	triggerPrice: number | null;
	triggerCondition: string | null;
	tp: number | null;
	sl: number | null;
	status: 'open' | 'partial' | 'filled' | 'cancelled';
	timestamp: number;
}

// ── Prices ───────────────────────────────────────────────────────────
export type Prices = Record<string, string>;

// ── Asset Metadata ───────────────────────────────────────────────────
export interface AssetMeta {
	name: string;
	szDecimals: number;
	maxLeverage: number;
	onlyIsolated: boolean;
}

// ── Active Asset Data ────────────────────────────────────────────────
export interface ActiveAssetData {
	coin: string;
	markPrice: string;
	oraclePrice: string;
	volume24h: string;
	openInterest: string;
	fundingRate: string;
	fundingInterval: string;
}

// ── Aggregation ──────────────────────────────────────────────────────
export interface AggregationLevel {
	label: string;
	tickSize: number;
	nSigFigs: number | null;
	mantissa: number | null;
}
