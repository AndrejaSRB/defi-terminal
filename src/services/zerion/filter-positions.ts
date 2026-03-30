import type { ZerionPosition } from './fetch-positions';

export interface WalletToken {
	network: string;
	symbol: string;
	name: string;
	decimals: number;
	balance: number;
	usdValue: number;
	tokenAddress: string | null;
	logo: string | null;
	verified: boolean;
}

const CHAIN_LABELS: Record<string, string> = {
	ethereum: 'Ethereum',
	arbitrum: 'Arbitrum',
	base: 'Base',
	optimism: 'Optimism',
	polygon: 'Polygon',
	avalanche: 'Avalanche',
	'binance-smart-chain': 'BNB Chain',
	solana: 'Solana',
};

export function getNetworkLabel(network: string): string {
	return CHAIN_LABELS[network] ?? network;
}

export function filterPositions(positions: ZerionPosition[]): WalletToken[] {
	return positions
		.filter((position) => {
			const info = position.attributes.fungible_info;
			if (!info.symbol) return false;
			if (position.attributes.quantity.float <= 0) return false;
			return true;
		})
		.map((position) => {
			const info = position.attributes.fungible_info;
			const chain = position.relationships.chain.data.id;
			const impl = info.implementations.find(
				(entry) => entry.chain_id === chain,
			);

			return {
				network: chain,
				symbol: info.symbol,
				name: info.name,
				decimals: impl?.decimals ?? 18,
				balance: position.attributes.quantity.float,
				usdValue: position.attributes.value ?? 0,
				tokenAddress: impl?.address ?? null,
				logo: info.icon?.url ?? null,
				verified: info.flags.verified,
			};
		})
		.filter((token) => token.usdValue > 0.01 || token.tokenAddress === null)
		.reduce<WalletToken[]>((deduped, token) => {
			const key = `${token.network}:${token.symbol}`;
			if (
				!deduped.some(
					(existing) => `${existing.network}:${existing.symbol}` === key,
				)
			) {
				deduped.push(token);
			}
			return deduped;
		}, []);
}
