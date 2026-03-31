// ── REST: Markets ──

export interface ExtMarketStats {
	dailyVolume: string;
	dailyVolumeBase: string;
	dailyPriceChangePercentage: string;
	dailyLow: string;
	dailyHigh: string;
	lastPrice: string;
	askPrice: string;
	bidPrice: string;
	markPrice: string;
	indexPrice: string;
	fundingRate: string;
	nextFundingRate: number;
	openInterest: string;
	openInterestBase: string;
}

export interface ExtTradingConfig {
	minOrderSize: string;
	minOrderSizeChange: string;
	minPriceChange: string;
	maxMarketOrderValue: string;
	maxLimitOrderValue: string;
	maxPositionValue: string;
	maxLeverage: string;
	maxNumOrders: string;
}

export interface ExtMarket {
	name: string;
	assetName: string;
	assetPrecision: number;
	collateralAssetName: string;
	collateralAssetPrecision: number;
	active: boolean;
	status: string;
	marketStats: ExtMarketStats;
	tradingConfig: ExtTradingConfig;
}

export interface ExtMarketsResponse {
	status: string;
	data: ExtMarket[];
}

// ── REST: Orderbook ──

export interface ExtOrderBookLevel {
	price: string;
	qty: string;
}

export interface ExtOrderBookResponse {
	status: string;
	data: {
		market: string;
		bid: ExtOrderBookLevel[];
		ask: ExtOrderBookLevel[];
	};
}

// ── REST: Trades ──

export interface ExtRestTrade {
	i: string;
	m: string;
	S: 'BUY' | 'SELL';
	tT: string;
	T: string;
	p: string;
	q: string;
}

export interface ExtTradesResponse {
	status: string;
	data: ExtRestTrade[];
}

// ── REST: Candles ──

export interface ExtCandle {
	o: string;
	h: string;
	l: string;
	c: string;
	v: string;
	T: string;
}

export interface ExtCandlesResponse {
	status: string;
	data: ExtCandle[];
}

// ── WS Messages ──

export interface ExtWsTrade {
	i: number;
	m: string;
	S: 'BUY' | 'SELL';
	tT: string;
	T: number;
	p: string;
	q: string;
}

export interface ExtWsCandle {
	o: string;
	h: string;
	l: string;
	c: string;
	v: string;
	T: number;
}

export interface ExtWsMarkPrice {
	m: string;
	p: string;
	ts: number;
}
