/** Extended GET /user/trades response */
export interface ExtTradeHistoryResponse {
	status: string;
	data: ExtTradeHistory[];
	pagination?: {
		cursor: number;
		count: number;
	};
}

export interface ExtTradeHistory {
	id: number;
	accountId: number;
	market: string;
	orderId: number;
	externalOrderId: string;
	side: 'BUY' | 'SELL';
	price: string;
	qty: string;
	value: string;
	fee: string;
	tradeType: 'TRADE' | 'LIQUIDATION' | 'DELEVERAGE';
	createdTime: number;
	isTaker: boolean;
	builderFee: string;
}
