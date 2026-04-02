import { useState, useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { useWalletChain } from '@/hooks/use-wallet-chain';
import { useWidgetTokens } from './use-widget-tokens';
import { useWidgetRoutes } from './use-widget-routes';
import type { WidgetConfig } from '../types';
import type { WalletTokenBalance } from '@/services/lifi/balances';

export function useWidgetForm(config: WidgetConfig) {
	const walletAddress = useAtomValue(walletAddressAtom);
	const { isOnChain, switchChain } = useWalletChain();

	// ── Token data ──

	const {
		allChainOptions,
		tokensForChain,
		isLoading: isLoadingTokens,
		refetch: refetchTokens,
	} = useWidgetTokens();

	// ── Form state ──

	const [selectedChainId, setSelectedChainId] = useState<number | null>(null);
	const [selectedTokenKey, setSelectedTokenKey] = useState<string | null>(null);
	const [amount, setAmount] = useState('');
	const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

	// ── Derived: chain + token selection ──

	const availableTokens = useMemo(
		() => (selectedChainId ? tokensForChain(selectedChainId) : []),
		[tokensForChain, selectedChainId],
	);

	const effectiveTokenKey = useMemo(() => {
		if (
			selectedTokenKey &&
			availableTokens.some(
				(token) => `${token.symbol}:${token.address}` === selectedTokenKey,
			)
		) {
			return selectedTokenKey;
		}
		if (availableTokens.length > 0) {
			const firstToken = availableTokens[0];
			return `${firstToken.symbol}:${firstToken.address}`;
		}
		return '';
	}, [selectedTokenKey, availableTokens]);

	const selectedToken: WalletTokenBalance | null = useMemo(
		() =>
			availableTokens.find(
				(token) => `${token.symbol}:${token.address}` === effectiveTokenKey,
			) ?? null,
		[availableTokens, effectiveTokenKey],
	);

	// ── Derived: direct deposit detection ──

	const isDirectDeposit = useMemo(() => {
		if (!selectedChainId || !selectedToken) return false;
		const isDestChain = selectedChainId === config.destinationChainId;
		const isDestToken =
			selectedToken.address.toLowerCase() ===
			config.destinationTokenAddress.toLowerCase();
		return isDestChain && isDestToken;
	}, [selectedChainId, selectedToken, config]);

	// ── Derived: validation ──

	const parsedAmount = Number(amount);
	const isValidAmount =
		parsedAmount > 0 &&
		selectedToken !== null &&
		parsedAmount <= selectedToken.balance;
	const amountError =
		parsedAmount > 0 && selectedToken && parsedAmount > selectedToken.balance
			? 'Insufficient balance'
			: null;

	// ── Derived: chain switching ──

	const needsChainSwitch =
		selectedChainId !== null && !isOnChain(selectedChainId);

	// ── Routes ──

	const fromTokenAddress = useMemo(() => {
		if (!selectedToken) return undefined;
		return selectedToken.address;
	}, [selectedToken]);

	const fromAmountWei = useMemo(() => {
		if (!isValidAmount || !selectedToken) return '';
		return BigInt(
			Math.floor(parsedAmount * 10 ** selectedToken.decimals),
		).toString();
	}, [isValidAmount, parsedAmount, selectedToken]);

	const {
		routes,
		isLoading: isLoadingRoutes,
		secondsLeft,
		isCountdownRunning,
		refresh: refreshRoutes,
	} = useWidgetRoutes({
		fromChainId: selectedChainId ?? undefined,
		toChainId: config.destinationChainId,
		fromTokenAddress: fromTokenAddress,
		toTokenAddress: config.destinationTokenAddress,
		fromAmount: fromAmountWei,
		fromAddress: walletAddress ?? undefined,
		enabled: isValidAmount && !isDirectDeposit,
	});

	const selectedRoute = routes[selectedRouteIndex] ?? routes[0] ?? null;

	// ── Derived: bridge deposit validation ──

	const estimatedReceiveAmount = useMemo(() => {
		if (!selectedRoute) return 0;
		const lastStep = selectedRoute.steps[selectedRoute.steps.length - 1];
		if (!lastStep) return 0;
		return (
			Number(lastStep.estimate.toAmount) / 10 ** config.destinationTokenDecimals
		);
	}, [selectedRoute, config.destinationTokenDecimals]);

	const bridgeDepositError = useMemo(() => {
		if (isDirectDeposit || !selectedRoute) return null;
		if (estimatedReceiveAmount < config.minDeposit) {
			return `Min deposit is ${config.minDeposit} ${config.destinationTokenSymbol}`;
		}
		return null;
	}, [isDirectDeposit, selectedRoute, estimatedReceiveAmount, config]);

	// ── Actions ──

	const handleChainChange = useCallback((chainId: number) => {
		setSelectedChainId(chainId);
		setSelectedTokenKey(null);
		setAmount('');
		setSelectedRouteIndex(0);
	}, []);

	const handleTokenChange = useCallback((tokenKey: string) => {
		setSelectedTokenKey(tokenKey);
		setAmount('');
		setSelectedRouteIndex(0);
	}, []);

	const handleAmountChange = useCallback((newAmount: string) => {
		setAmount(newAmount);
		setSelectedRouteIndex(0);
	}, []);

	const handleMaxClick = useCallback(() => {
		if (selectedToken) {
			setAmount(selectedToken.balance.toString());
			setSelectedRouteIndex(0);
		}
	}, [selectedToken]);

	const handleSwitchChain = useCallback(async () => {
		if (selectedChainId === null) return;
		await switchChain(selectedChainId);
	}, [selectedChainId, switchChain]);

	// ── Auto-select first chain ──

	const chainOptions = allChainOptions;

	if (chainOptions.length > 0 && selectedChainId === null) {
		const firstChainId = chainOptions[0].chainId;
		queueMicrotask(() => setSelectedChainId(firstChainId));
	}

	return {
		// Config
		config,
		walletAddress,

		// Token state
		chainOptions,
		availableTokens,
		selectedChainId,
		effectiveTokenKey,
		selectedToken,
		isLoadingTokens,

		// Amount state
		amount,
		parsedAmount,
		isValidAmount,
		amountError,

		// Route state
		routes,
		selectedRoute,
		selectedRouteIndex,
		isLoadingRoutes,
		secondsLeft,
		isCountdownRunning,

		// Derived
		isDirectDeposit,
		needsChainSwitch,
		estimatedReceiveAmount,
		bridgeDepositError,

		// Actions
		setChain: handleChainChange,
		setToken: handleTokenChange,
		setAmount: handleAmountChange,
		setSelectedRouteIndex,
		handleMaxClick,
		handleSwitchChain,
		refreshRoutes,
		refetchTokens,
	};
}
