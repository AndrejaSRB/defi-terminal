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

	placeOrder(params: PlaceOrderParams): Promise<OrderResult>;

	cancelOrder(params: CancelOrderParams): Promise<void>;

	cancelOrders(params: CancelOrderParams[]): Promise<void>;

	modifyOrder(params: ModifyOrderParams): Promise<OrderResult>;

	closePosition(params: {
		coin: string;
		size: number;
		side: 'buy' | 'sell';
	}): Promise<OrderResult>;

	updateLeverage(params: UpdateLeverageParams): Promise<void>;

	updateMarginMode(params: UpdateLeverageParams): Promise<void>;

	setPositionTpSl(params: SetPositionTpSlParams): Promise<void>;

	withdraw(params: WithdrawParams): Promise<WithdrawResult>;
}

export interface WithdrawParams {
	amount: number;
	destination: string;
	/** Sign function — withdrawal requires user's EOA signature, not agent */
	sign: (typedData: unknown) => Promise<string>;
}

export interface WithdrawResult {
	status: 'success' | 'error';
	message: string;
}

export interface SetPositionTpSlParams {
	coin: string;
	side: 'LONG' | 'SHORT';
	size: number;
	tp?: number;
	sl?: number;
}
