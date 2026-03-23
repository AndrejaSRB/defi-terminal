export interface HlOpenOrder {
	coin: string;
	side: 'A' | 'B';
	limitPx: string;
	sz: string;
	oid: number;
	timestamp: number;
	triggerCondition: string;
	isTrigger: boolean;
	triggerPx: string;
	children: HlOpenOrder[];
	isPositionTpsl: boolean;
	reduceOnly: boolean;
	orderType: string;
	origSz: string;
	tif: string | null;
	cloid: string | null;
}

export interface HlOpenOrdersResponse {
	dex: string;
	user: string;
	orders: HlOpenOrder[];
}
