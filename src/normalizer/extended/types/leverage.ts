/** Extended GET /user/leverage response */
export interface ExtLeverageResponse {
	status: string;
	data: ExtLeverage[];
}

export interface ExtLeverage {
	market: string;
	leverage: string;
}
