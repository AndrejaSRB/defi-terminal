import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { activeNormalizerAtom } from '@/atoms/dex';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { fetchLifiQuote } from '@/services/lifi/quote';
import { zerionNetworkToChainId, getChainName } from '@/services/chains/config';
import { useCountdown } from '@/hooks/use-countdown';
import { useWalletChain } from '@/hooks/use-wallet-chain';
import { useWalletTokens } from './use-wallet-tokens';
import {
	getNetworkLabel,
	type WalletToken,
} from '@/services/zerion/filter-positions';
import type { LifiQuoteResponse } from '@/services/lifi/types';

const QUOTE_DEBOUNCE_MS = 800;
const QUOTE_REFRESH_SECONDS = 30;

export function useBridgeQuote() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const walletAddress = useAtomValue(walletAddressAtom);
	const { isOnChain, switchChain } = useWalletChain();
	const { tokens, networks, isLoading: isLoadingTokens } = useWalletTokens();

	const { depositConfig } = normalizer;
	const destChainId = depositConfig.chainId;
	const destToken = depositConfig.tokenAddress;
	const destChainName = getChainName(destChainId);

	const [selectedNetwork, setSelectedNetwork] = useState('');
	const [selectedTokenKey, setSelectedTokenKey] = useState<string | null>(null);
	const [amount, setAmount] = useState('');
	const [lifiQuote, setLifiQuote] = useState<LifiQuoteResponse | null>(null);
	const [isLoadingQuote, setIsLoadingQuote] = useState(false);
	const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Filter out the deposit chain (handled by Deposit tab)
	const crossChainNetworks = networks.filter((network) => {
		const chainId = zerionNetworkToChainId(network);
		return chainId !== destChainId;
	});

	const chainOptions = crossChainNetworks.map((network) => ({
		id: network,
		name: getNetworkLabel(network),
		chainId: zerionNetworkToChainId(network),
	}));

	// Auto-select first network
	useEffect(() => {
		if (crossChainNetworks.length > 0 && !selectedNetwork) {
			setSelectedNetwork(crossChainNetworks[0]);
		}
	}, [crossChainNetworks, selectedNetwork]);

	const availableTokens = tokens.filter(
		(token) => token.network === selectedNetwork,
	);

	// Derive effective token key
	const effectiveTokenKey = useMemo(() => {
		if (
			selectedTokenKey &&
			availableTokens.some(
				(token) => `${token.symbol}:${token.tokenAddress}` === selectedTokenKey,
			)
		) {
			return selectedTokenKey;
		}
		if (availableTokens.length > 0) {
			const firstToken = availableTokens[0];
			return `${firstToken.symbol}:${firstToken.tokenAddress}`;
		}
		return '';
	}, [selectedTokenKey, availableTokens]);

	const selectedToken: WalletToken | null =
		availableTokens.find(
			(token) => `${token.symbol}:${token.tokenAddress}` === effectiveTokenKey,
		) ?? null;

	// Validation
	const parsedAmount = Number(amount);
	const isValidAmount =
		parsedAmount > 0 &&
		selectedToken !== null &&
		parsedAmount <= selectedToken.balance;
	const amountError =
		parsedAmount > 0 && selectedToken && parsedAmount > selectedToken.balance
			? 'Insufficient balance'
			: null;

	// Chain switching
	const requiredChainId = zerionNetworkToChainId(selectedNetwork) ?? null;
	const needsChainSwitch =
		requiredChainId !== null && !isOnChain(requiredChainId);

	const handleSwitchChain = useCallback(async () => {
		if (!requiredChainId) return;
		try {
			await switchChain(requiredChainId);
		} catch {
			toast.error('Failed to switch network');
		}
	}, [requiredChainId, switchChain]);

	// ── Quote Fetching ──

	const quoteParamsRef = useRef({
		isValidAmount,
		walletAddress,
		selectedToken,
		parsedAmount,
		requiredChainId,
		destChainId,
		destToken,
	});
	quoteParamsRef.current = {
		isValidAmount,
		walletAddress,
		selectedToken,
		parsedAmount,
		requiredChainId,
		destChainId,
		destToken,
	};

	const doFetchQuote = useCallback(async () => {
		const params = quoteParamsRef.current;
		if (
			!params.isValidAmount ||
			!params.walletAddress ||
			!params.selectedToken ||
			params.parsedAmount === 0 ||
			!params.requiredChainId
		) {
			return;
		}

		const tokenAddress =
			params.selectedToken.tokenAddress ??
			'0x0000000000000000000000000000000000000000';
		const amountWei = BigInt(
			Math.floor(params.parsedAmount * 10 ** params.selectedToken.decimals),
		).toString();

		setIsLoadingQuote(true);
		try {
			const quote = await fetchLifiQuote({
				fromChain: params.requiredChainId,
				toChain: params.destChainId,
				fromToken: tokenAddress,
				toToken: params.destToken,
				fromAmount: amountWei,
				fromAddress: params.walletAddress,
			});
			setLifiQuote(quote);
		} catch (quoteError) {
			console.error('[CrossChain] Quote failed:', quoteError);
			setLifiQuote(null);
			toast.error(
				quoteError instanceof Error
					? quoteError.message
					: 'Failed to get route',
			);
		} finally {
			setIsLoadingQuote(false);
		}
	}, []);

	// Countdown for auto-refresh
	const quoteCountdown = useCountdown({
		duration: QUOTE_REFRESH_SECONDS,
		onExpire: doFetchQuote,
	});
	const countdownRef = useRef(quoteCountdown);
	countdownRef.current = quoteCountdown;

	// Debounced fetch on input change
	useEffect(() => {
		if (quoteTimer.current) clearTimeout(quoteTimer.current);
		setLifiQuote(null);
		countdownRef.current.stop();

		if (
			!isValidAmount ||
			!walletAddress ||
			!selectedToken ||
			parsedAmount === 0 ||
			!requiredChainId
		) {
			setIsLoadingQuote(false);
			return;
		}

		setIsLoadingQuote(true);

		quoteTimer.current = setTimeout(async () => {
			await doFetchQuote();
			countdownRef.current.start();
		}, QUOTE_DEBOUNCE_MS);

		return () => {
			if (quoteTimer.current) clearTimeout(quoteTimer.current);
		};
	}, [
		parsedAmount,
		selectedNetwork,
		effectiveTokenKey,
		isValidAmount,
		walletAddress,
		selectedToken,
		requiredChainId,
		doFetchQuote,
	]);

	// ── Actions ──

	const handleNetworkChange = useCallback((network: string) => {
		setSelectedNetwork(network);
		setAmount('');
	}, []);

	const handleMaxClick = useCallback(() => {
		if (selectedToken) setAmount(selectedToken.balance.toString());
	}, [selectedToken]);

	return {
		// State
		selectedNetwork,
		effectiveTokenKey,
		amount,
		lifiQuote,
		isLoadingQuote,
		isLoadingTokens,
		isValidAmount,
		amountError,
		needsChainSwitch,
		requiredChainId,
		quoteSecondsLeft: quoteCountdown.secondsLeft,
		isQuoteCountdownRunning: quoteCountdown.isRunning,
		// Derived
		chainOptions,
		availableTokens,
		selectedToken,
		destChainName,
		depositConfig,
		// Actions
		setSelectedNetwork: handleNetworkChange,
		setSelectedTokenKey,
		setAmount,
		handleMaxClick,
		handleSwitchChain,
		doFetchQuote,
	};
}
