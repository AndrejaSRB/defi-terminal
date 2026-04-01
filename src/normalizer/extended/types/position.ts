/** Extended GET /user/positions response */
export interface ExtPositionsResponse {
	status: string;
	data: ExtPosition[];
}

export interface ExtPosition {
	id: number;
	accountId: number;
	market: string;
	side: 'LONG' | 'SHORT';
	leverage: string;
	size: string;
	value: string;
	openPrice: string;
	markPrice: string;
	liquidationPrice: string;
	margin: string;
	unrealisedPnl: string;
	realisedPnl: string;
	tpTriggerPrice: string | null;
	tpLimitPrice: string | null;
	slTriggerPrice: string | null;
	slLimitPrice: string | null;
	adl: string;
	maxPositionSize: string;
	createdTime: number;
	updatedTime: number;
}
