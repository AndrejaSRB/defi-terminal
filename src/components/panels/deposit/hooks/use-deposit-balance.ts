import { useState, useEffect, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { activeNormalizerAtom } from '@/atoms/dex';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { readTokenBalance } from '@/services/chains/allowance';

const POLL_INTERVAL = 10_000;

export function useDepositBalance() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const walletAddress = useAtomValue(walletAddressAtom);
	const { chainId, tokenAddress, tokenDecimals, tokenSymbol } =
		normalizer.depositConfig;

	const [balance, setBalance] = useState(0);
	const [isLoading, setIsLoading] = useState(false);

	const fetchBalance = useCallback(async () => {
		if (!walletAddress) {
			setBalance(0);
			return;
		}

		try {
			const raw = await readTokenBalance(chainId, tokenAddress, walletAddress);
			setBalance(Number(raw) / 10 ** tokenDecimals);
		} catch {
			console.warn('[DepositBalance] Failed to read balance');
		}
	}, [walletAddress, chainId, tokenAddress, tokenDecimals]);

	useEffect(() => {
		if (!walletAddress) return;

		setIsLoading(true);
		fetchBalance().finally(() => setIsLoading(false));

		const interval = setInterval(fetchBalance, POLL_INTERVAL);
		return () => clearInterval(interval);
	}, [walletAddress, fetchBalance]);

	return { balance, isLoading, refetch: fetchBalance, tokenSymbol, chainId };
}
