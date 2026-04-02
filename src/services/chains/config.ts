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
	rpcUrl?: string;
}

const alchemyKey = import.meta.env.VITE_ALCHEMY_KEY || '';
const alchemy = (network: string) =>
	alchemyKey ? `https://${network}.g.alchemy.com/v2/${alchemyKey}` : undefined;

const CHAINS: ChainConfig[] = [
	{
		id: 1,
		name: 'Ethereum',
		viemChain: mainnet,
		rpcUrl: alchemy('eth-mainnet'),
	},
	{
		id: 42161,
		name: 'Arbitrum',
		viemChain: arbitrum,
		rpcUrl: alchemy('arb-mainnet'),
	},
	{ id: 8453, name: 'Base', viemChain: base, rpcUrl: alchemy('base-mainnet') },
	{
		id: 10,
		name: 'Optimism',
		viemChain: optimism,
		rpcUrl: alchemy('opt-mainnet'),
	},
	{
		id: 137,
		name: 'Polygon',
		viemChain: polygon,
		rpcUrl: alchemy('polygon-mainnet'),
	},
	{
		id: 43114,
		name: 'Avalanche',
		viemChain: avalanche,
		rpcUrl: alchemy('avax-mainnet'),
	},
	{ id: 56, name: 'BNB Chain', viemChain: bsc, rpcUrl: alchemy('bnb-mainnet') },
];

const chainById = new Map(CHAINS.map((chain) => [chain.id, chain]));
export function getChainConfig(chainId: number): ChainConfig | undefined {
	return chainById.get(chainId);
}

export function getChainName(chainId: number): string {
	return chainById.get(chainId)?.name ?? `Chain ${chainId}`;
}

export function getAllChainIds(): number[] {
	return CHAINS.map((chain) => chain.id);
}
