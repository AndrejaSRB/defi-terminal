import { getWalletBalances } from '@lifi/sdk';

const MIN_USD_VALUE = 0.01;

export interface WalletTokenBalance {
	chainId: number;
	address: string;
	symbol: string;
	name: string;
	decimals: number;
	/** Human-readable balance */
	balance: number;
	/** USD value of the balance */
	usdValue: number;
	/** Price per token in USD */
	priceUSD: number;
	logoURI: string | null;
}

/**
 * Fetch all token balances for a wallet across all supported chains.
 * Returns a flat array sorted by USD value descending.
 */
export async function fetchWalletBalances(
	walletAddress: string,
): Promise<WalletTokenBalance[]> {
	const balancesByChain = await getWalletBalances(walletAddress);
	const result: WalletTokenBalance[] = [];

	for (const [chainIdStr, tokens] of Object.entries(balancesByChain)) {
		const chainId = Number(chainIdStr);

		for (const token of tokens) {
			const balance = tokenAmountToHuman(token);
			const priceUSD = Number(token.priceUSD ?? 0);
			const usdValue = balance * priceUSD;

			// Skip dust (< $0.01)
			if (usdValue < MIN_USD_VALUE && balance > 0) continue;
			// Skip zero balances
			if (balance === 0) continue;

			result.push({
				chainId,
				address: token.address,
				symbol: token.symbol,
				name: token.name,
				decimals: token.decimals,
				balance,
				usdValue,
				priceUSD,
				logoURI: token.logoURI ?? null,
			});
		}
	}

	// Sort by USD value descending
	result.sort((tokenA, tokenB) => tokenB.usdValue - tokenA.usdValue);

	return result;
}

function tokenAmountToHuman(token: {
	amount?: string | bigint;
	decimals: number;
}): number {
	if (!token.amount) return 0;
	return Number(token.amount) / 10 ** token.decimals;
}
