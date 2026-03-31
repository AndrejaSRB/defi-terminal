/**
 * Form state for Extended bridge deposit.
 * Manages chain selection, amount, quote fetching, and USDC balance.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { getStoredAccount } from '@/normalizer/extended/utils/storage';
import {
	fetchBridgeConfig,
	getBridgeQuote,
} from '@/normalizer/extended/services/bridge-api';
import {
	CHAIN_META,
	type BridgeChain,
	type BridgeQuote,
} from '@/normalizer/extended/services/bridge-types';
import { readTokenBalance } from '@/services/chains/allowance';

export function useExtendedDepositForm() {
	const walletAddress = useAtomValue(walletAddressAtom);

	const [chains, setChains] = useState<BridgeChain[]>([]);
	const [selectedChain, setSelectedChain] = useState<string>('ARB');
	const [amount, setAmount] = useState('');
	const [quote, setQuote] = useState<BridgeQuote | null>(null);
	const [balance, setBalance] = useState(0);
	const [isLoadingQuote, setIsLoadingQuote] = useState(false);
	const [isLoadingBalance, setIsLoadingBalance] = useState(false);

	const account = walletAddress ? getStoredAccount(walletAddress) : null;
	const apiKey = account?.apiKey ?? '';

	const chainMeta = CHAIN_META[selectedChain];

	// Fetch bridge config on mount
	useEffect(() => {
		if (!apiKey) return;
		fetchBridgeConfig(apiKey)
			.then((config) => {
				// Filter out STRK (Starknet) — it's the destination, not a source for deposits
				const evmChains = config.chains.filter(
					(chain) => chain.chain !== 'STRK',
				);
				setChains(evmChains);
				if (
					evmChains.length > 0 &&
					!evmChains.find((chain) => chain.chain === selectedChain)
				) {
					setSelectedChain(evmChains[0].chain);
				}
			})
			.catch((error) => console.error('[BridgeConfig]', error));
	}, [apiKey]);

	// Fetch USDC balance when chain or wallet changes
	useEffect(() => {
		if (!walletAddress || !chainMeta) return;
		setIsLoadingBalance(true);
		readTokenBalance(chainMeta.chainId, chainMeta.usdcAddress, walletAddress)
			.then((raw) => setBalance(Number(raw) / 1e6))
			.catch((error) => {
				console.error('[DepositBalance]', chainMeta.name, error);
				setBalance(0);
			})
			.finally(() => setIsLoadingBalance(false));
	}, [walletAddress, chainMeta]);

	// Fetch quote when amount changes (debounced)
	useEffect(() => {
		const numAmount = parseFloat(amount);
		if (!apiKey || !numAmount || numAmount <= 0) {
			setQuote(null);
			return;
		}

		const timeout = setTimeout(async () => {
			setIsLoadingQuote(true);
			try {
				const bridgeQuote = await getBridgeQuote(
					apiKey,
					selectedChain,
					numAmount,
				);
				setQuote(bridgeQuote);
			} catch (error) {
				console.error('[BridgeQuote]', error);
				setQuote(null);
			} finally {
				setIsLoadingQuote(false);
			}
		}, 500);

		return () => clearTimeout(timeout);
	}, [apiKey, selectedChain, amount]);

	const setMax = useCallback(() => {
		if (balance > 0) setAmount(String(balance));
	}, [balance]);

	const bridgeContract = useMemo(
		() =>
			chains.find((chain) => chain.chain === selectedChain)?.contractAddress ??
			'',
		[chains, selectedChain],
	);

	const receiveAmount = useMemo(() => {
		const numAmount = parseFloat(amount) || 0;
		const fee = parseFloat(quote?.fee ?? '0');
		return Math.max(0, numAmount - fee);
	}, [amount, quote]);

	const isValid = useMemo(() => {
		const numAmount = parseFloat(amount) || 0;
		return (
			numAmount > 0 &&
			numAmount <= balance &&
			!!quote &&
			!isLoadingQuote &&
			!!bridgeContract
		);
	}, [amount, balance, quote, isLoadingQuote, bridgeContract]);

	return {
		chains,
		selectedChain,
		setSelectedChain,
		amount,
		setAmount,
		setMax,
		balance,
		isLoadingBalance,
		quote,
		isLoadingQuote,
		receiveAmount,
		bridgeContract,
		chainMeta,
		isValid,
		apiKey,
	};
}
