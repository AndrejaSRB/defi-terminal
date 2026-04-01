/** Extended GET /user/orders response */
export interface ExtOrdersResponse {
	status: string;
	data: ExtOrder[];
}

export interface ExtOrder {
	id: number;
	accountId: number;
	externalId: string;
	market: string;
	type: 'LIMIT' | 'CONDITIONAL' | 'TPSL' | 'TWAP';
	side: 'BUY' | 'SELL';
	status: string;
	price: string;
	averagePrice: string | null;
	qty: string;
	filledQty: string | null;
	payedFee: string | null;
	trigger?: {
		triggerPrice: string;
		triggerPriceType: string;
		triggerPriceDirection: string;
		executionPriceType: string;
	};
	tpSlType?: string;
	takeProfit?: {
		triggerPrice: string;
		triggerPriceType: string;
		price: string;
		priceType: string;
	};
	stopLoss?: {
		triggerPrice: string;
		triggerPriceType: string;
		price: string;
		priceType: string;
	};
	reduceOnly: boolean;
	postOnly: boolean;
	createdTime: number;
	updatedTime: number;
	timeInForce: string;
	expireTime: number;
}
