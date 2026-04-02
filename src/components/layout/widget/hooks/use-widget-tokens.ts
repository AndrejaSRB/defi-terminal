import { useMemo, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import {
	fetchWalletBalances,
	type WalletTokenBalance,
} from '@/services/lifi/balances';
import { getChainName } from '@/services/chains/config';

export interface ChainOption {
	chainId: number;
	name: string;
}

const STALE_TIME = 60_000;

export function useWidgetTokens() {
	const walletAddress = useAtomValue(walletAddressAtom);
	const queryClient = useQueryClient();

	const { data: tokens = [], isLoading } = useQuery({
		queryKey: ['wallet-balances', walletAddress],
		queryFn: () => fetchWalletBalances(walletAddress!),
		enabled: !!walletAddress,
		staleTime: STALE_TIME,
	});

	const refetch = useCallback(() => {
		queryClient.invalidateQueries({
			queryKey: ['wallet-balances', walletAddress],
		});
	}, [queryClient, walletAddress]);

	const allChainOptions = useMemo(() => {
		const seen = new Set<number>();
		const options: ChainOption[] = [];
		for (const token of tokens) {
			if (seen.has(token.chainId)) continue;
			seen.add(token.chainId);
			options.push({
				chainId: token.chainId,
				name: getChainName(token.chainId),
			});
		}
		return options;
	}, [tokens]);

	const tokensForChain = useMemo(() => {
		const byChain = new Map<number, WalletTokenBalance[]>();
		for (const token of tokens) {
			const existing = byChain.get(token.chainId);
			if (existing) {
				existing.push(token);
			} else {
				byChain.set(token.chainId, [token]);
			}
		}
		return (chainId: number) => byChain.get(chainId) ?? [];
	}, [tokens]);

	return {
		allChainOptions,
		tokensForChain,
		isLoading,
		refetch,
	};
}
