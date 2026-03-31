/**
 * Types for Extended's Rhino.fi bridge integration.
 */

export interface BridgeChain {
	/** Chain identifier (ARB, ETH, BASE, BSC, AVAX, MATIC) */
	chain: string;
	/** Bridge contract address on this chain */
	contractAddress: string;
}

export interface BridgeConfig {
	chains: BridgeChain[];
}

export interface BridgeQuote {
	/** Quote ID — used to commit the quote */
	id: string;
	/** Bridge fee in USD */
	fee: string;
}

/** Chain metadata for display and on-chain operations */
export interface ChainMeta {
	chainId: number;
	name: string;
	usdcAddress: string;
	nativeSymbol: string;
}

/** Map Extended chain codes (from /bridge/config) to on-chain metadata */
export const CHAIN_META: Record<string, ChainMeta> = {
	ARB: {
		chainId: 42161,
		name: 'Arbitrum',
		usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
		nativeSymbol: 'ETH',
	},
	ETH: {
		chainId: 1,
		name: 'Ethereum',
		usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
		nativeSymbol: 'ETH',
	},
	BASE: {
		chainId: 8453,
		name: 'Base',
		usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
		nativeSymbol: 'ETH',
	},
	BNB: {
		chainId: 56,
		name: 'BSC',
		usdcAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
		nativeSymbol: 'BNB',
	},
	AVALANCHE: {
		chainId: 43114,
		name: 'Avalanche',
		usdcAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
		nativeSymbol: 'AVAX',
	},
	POLYGON: {
		chainId: 137,
		name: 'Polygon',
		usdcAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
		nativeSymbol: 'POL',
	},
};
