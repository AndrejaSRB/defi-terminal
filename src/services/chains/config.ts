import type { Chain } from 'viem';
import {
	mainnet,
	arbitrum,
	base,
	optimism,
	polygon,
	avalanche,
	bsc,
} from 'viem/chains';

export interface ChainConfig {
	id: number;
	name: string;
	viemChain: Chain;
}

const CHAINS: ChainConfig[] = [
	{ id: 1, name: 'Ethereum', viemChain: mainnet },
	{ id: 42161, name: 'Arbitrum', viemChain: arbitrum },
	{ id: 8453, name: 'Base', viemChain: base },
	{ id: 10, name: 'Optimism', viemChain: optimism },
	{ id: 137, name: 'Polygon', viemChain: polygon },
	{ id: 43114, name: 'Avalanche', viemChain: avalanche },
	{ id: 56, name: 'BNB Chain', viemChain: bsc },
];

const chainById = new Map(CHAINS.map((chain) => [chain.id, chain]));
const zerionToChainId = new Map<string, number>([
	['ethereum', 1],
	['arbitrum', 42161],
	['base', 8453],
	['optimism', 10],
	['polygon', 137],
	['avalanche', 43114],
	['binance-smart-chain', 56],
]);

export function getChainConfig(chainId: number): ChainConfig | undefined {
	return chainById.get(chainId);
}

export function getChainName(chainId: number): string {
	return chainById.get(chainId)?.name ?? `Chain ${chainId}`;
}

export function zerionNetworkToChainId(network: string): number | undefined {
	return zerionToChainId.get(network);
}

export function getAllChainIds(): number[] {
	return CHAINS.map((chain) => chain.id);
}
