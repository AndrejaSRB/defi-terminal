/** Configuration passed by the parent to fix the destination side */
export interface WidgetConfig {
	/** Chain ID for native/direct deposits (e.g. Arbitrum 42161) */
	destinationChainId: number;
	/** LI.FI destination chain ID for cross-chain routes (e.g. HL L1 1337) */
	lifiDestinationChainId: number;
	destinationTokenAddress: string;
	destinationTokenSymbol: string;
	destinationTokenDecimals: number;
	/** Contract address that receives the direct deposit */
	bridgeAddress: string;
	/** Minimum deposit in human-readable units */
	minDeposit: number;
	/** Fixed fee for direct deposit (in destination token units) */
	directDepositFee: number;
	/** Estimated time for direct deposit */
	directDepositTime: string;
	/** Display name for the final destination (e.g. "HyperLiquid") */
	destinationName: string;
}
