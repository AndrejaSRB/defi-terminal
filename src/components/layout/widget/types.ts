/** Configuration passed by the parent to fix the destination side */
export interface WidgetConfig {
	destinationChainId: number;
	destinationTokenAddress: string;
	destinationTokenSymbol: string;
	destinationTokenDecimals: number;
	/** Contract address that receives the deposit */
	bridgeAddress: string;
	/** Minimum deposit in human-readable units */
	minDeposit: number;
	/** Fixed fee for direct deposit (in destination token units) */
	directDepositFee: number;
	/** Estimated time for direct deposit */
	directDepositTime: string;
}
