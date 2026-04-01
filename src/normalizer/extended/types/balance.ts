/** Extended GET /user/balance response */
export interface ExtBalanceResponse {
	status: string;
	data: ExtBalance;
}

export interface ExtBalance {
	collateralName: string;
	balance: string;
	status: string;
	equity: string;
	spotEquity: string;
	availableForTrade: string;
	availableForWithdrawal: string;
	unrealisedPnl: string;
	initialMargin: string;
	marginRatio: string;
	updatedTime: number;
	midPriceUnrealisedPnl: string;
	exposure: string;
	leverage: string;
}
