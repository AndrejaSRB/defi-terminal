import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAtomValue } from 'jotai';
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

// Module-level cache — prevents re-fetching on tab switches / dialog reopens
let cachedAddress = '';
let cachedTokens: WalletTokenBalance[] = [];
let cachedAt = 0;
let fetchInFlight: Promise<WalletTokenBalance[]> | null = null;
const CACHE_TTL = 60_000;

export function useWidgetTokens() {
	const walletAddress = useAtomValue(walletAddressAtom);
	const [tokens, setTokens] = useState<WalletTokenBalance[]>(
		walletAddress === cachedAddress ? cachedTokens : [],
	);
	const [isLoading, setIsLoading] = useState(false);
	const [fetchVersion, setFetchVersion] = useState(0);

	useEffect(() => {
		if (!walletAddress) {
			setTokens([]);
			return;
		}

		// Use cache if fresh and not force-refetching
		if (
			fetchVersion === 0 &&
			walletAddress === cachedAddress &&
			cachedTokens.length > 0 &&
			Date.now() - cachedAt < CACHE_TTL
		) {
			setTokens(cachedTokens);
			return;
		}

		// Deduplicate in-flight requests
		if (!fetchInFlight) {
			fetchInFlight = fetchWalletBalances(walletAddress).finally(() => {
				fetchInFlight = null;
			});
		}

		let cancelled = false;
		setIsLoading(true);

		fetchInFlight
			.then((balances) => {
				if (cancelled) return;
				cachedAddress = walletAddress;
				cachedTokens = balances;
				cachedAt = Date.now();
				setTokens(balances);
			})
			.catch(() => {
				if (!cancelled) setTokens([]);
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [walletAddress, fetchVersion]);

	const refetch = useCallback(() => {
		cachedAt = 0; // Invalidate cache
		setFetchVersion((prev) => prev + 1);
	}, []);

	// Derive unique chains from tokens
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
