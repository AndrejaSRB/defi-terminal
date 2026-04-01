/** Extended GET /user/funding/history response */
export interface ExtFundingHistoryResponse {
	status: string;
	data: ExtFundingPayment[];
	pagination?: { cursor: number; count: number };
}

export interface ExtFundingPayment {
	id: number;
	accountId: number;
	market: string;
	positionId: number;
	side: 'LONG' | 'SHORT';
	size: string;
	value: string;
	markPrice: string;
	fundingFee: string;
	fundingRate: string;
	paidTime: number;
}
