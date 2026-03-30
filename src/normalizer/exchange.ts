import type { TradingWebSocket } from '@/services/websocket';

// ── Canonical Order Types ───────────────────────────────────────────

export interface PlaceOrderParams {
	coin: string;
	side: 'buy' | 'sell';
	type: 'market' | 'limit';
	price: number;
	size: number;
	reduceOnly: boolean;
	slippage?: number;
	tif?: 'Gtc' | 'Ioc' | 'Alo';
	tp?: number;
	sl?: number;
	cloid?: string;
}

export interface OrderResult {
	status: 'success' | 'error';
	orderId?: number;
	message?: string;
}

export interface CancelOrderParams {
	coin: string;
	orderId: number;
}

export interface ModifyOrderParams {
	coin: string;
	orderId: number;
	price: number;
	size: number;
	reduceOnly: boolean;
	tif?: 'Gtc' | 'Ioc' | 'Alo';
}

export interface UpdateLeverageParams {
	coin: string;
	leverage: number;
	isCross: boolean;
}

// ── DexExchange Interface ───────────────────────────────────────────

export interface DexExchange {
	/** Set the active wallet address for signing operations */
	setWalletAddress(address: string): void;

	placeOrder(
		params: PlaceOrderParams,
		ws: TradingWebSocket,
	): Promise<OrderResult>;

	cancelOrder(params: CancelOrderParams, ws: TradingWebSocket): Promise<void>;

	cancelOrders(
		params: CancelOrderParams[],
		ws: TradingWebSocket,
	): Promise<void>;

	modifyOrder(
		params: ModifyOrderParams,
		ws: TradingWebSocket,
	): Promise<OrderResult>;

	closePosition(
		params: { coin: string; size: number; side: 'buy' | 'sell' },
		ws: TradingWebSocket,
	): Promise<OrderResult>;

	updateLeverage(
		params: UpdateLeverageParams,
		ws: TradingWebSocket,
	): Promise<void>;

	updateMarginMode(
		params: UpdateLeverageParams,
		ws: TradingWebSocket,
	): Promise<void>;

	setPositionTpSl(
		params: SetPositionTpSlParams,
		ws: TradingWebSocket,
	): Promise<void>;
}

export interface SetPositionTpSlParams {
	coin: string;
	side: 'LONG' | 'SHORT';
	size: number;
	tp?: number;
	sl?: number;
}
