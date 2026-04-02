import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { getChainName } from '@/services/chains/config';
import { buildDepositTx } from '@/services/hyperliquid/deposit';
import { classifyTxError } from '@/lib/tx-errors';
import { useWalletTransaction } from '@/hooks/use-wallet-transaction';
import { useWalletChain } from '@/hooks/use-wallet-chain';
import { useWidgetForm } from './use-widget-form';
import { useWidgetExecute } from './use-widget-execute';
import type { WidgetConfig } from '../types';

const SPIN_DURATION_MS = 600;

export type DepositStatus = 'idle' | 'depositing' | 'success' | 'error';

interface UseWidgetParams {
	config: WidgetConfig;
}

export function useWidget({ config }: UseWidgetParams) {
	const form = useWidgetForm(config);
	const bridgeExecution = useWidgetExecute(config);
	const { send: sendTransaction } = useWalletTransaction();
	const { isOnChain, switchChain } = useWalletChain();

	const [isSpinning, setIsSpinning] = useState(false);
	const [depositStatus, setDepositStatus] = useState<DepositStatus>('idle');

	// ── Refresh routes ──

	const handleRefresh = useCallback(() => {
		setIsSpinning(true);
		form.refreshRoutes();
		setTimeout(() => setIsSpinning(false), SPIN_DURATION_MS);
	}, [form.refreshRoutes]);

	// ── Direct deposit (ARB + USDC → HL bridge) ──

	const handleDirectDeposit = useCallback(async () => {
		if (!form.selectedToken || !form.isValidAmount) return;

		const amountWei = BigInt(
			Math.floor(Number(form.amount) * 10 ** config.destinationTokenDecimals),
		);

		setDepositStatus('depositing');

		try {
			if (!isOnChain(config.destinationChainId)) {
				await switchChain(config.destinationChainId);
			}

			const tx = buildDepositTx(
				{
					chainId: config.destinationChainId,
					tokenAddress: config.destinationTokenAddress,
					tokenSymbol: config.destinationTokenSymbol,
					tokenDecimals: config.destinationTokenDecimals,
					bridgeAddress: config.bridgeAddress,
					minDeposit: config.minDeposit,
					fee: config.directDepositFee,
					estimatedTime: config.directDepositTime,
					methods: [],
				},
				amountWei,
			);

			const hash = await sendTransaction({
				to: tx.to,
				data: tx.data,
				value: BigInt(tx.value),
				chainId: tx.chainId,
			});

			setDepositStatus('success');
			toast.success('Deposit submitted', {
				description: `Tx: ${hash.slice(0, 10)}...`,
			});
		} catch (depositError) {
			const classified = classifyTxError(depositError);
			console.error('[Widget] Deposit error:', classified.type, depositError);
			toast.error(classified.message);
			setDepositStatus('error');
		}
	}, [
		form.selectedToken,
		form.isValidAmount,
		form.amount,
		config,
		isOnChain,
		switchChain,
		sendTransaction,
	]);

	// ── Bridge execution ──

	const handleBridgeExecute = useCallback(() => {
		if (
			!form.selectedRoute ||
			!form.selectedToken ||
			!form.selectedChainId ||
			!form.walletAddress
		)
			return;

		bridgeExecution.execute(
			form.selectedRoute,
			form.selectedChainId,
			form.selectedToken.address,
			form.walletAddress,
		);
	}, [form, bridgeExecution.execute]);

	// ── Main execute handler ──

	const handleExecute = useCallback(() => {
		if (form.isDirectDeposit) {
			handleDirectDeposit();
			return;
		}
		handleBridgeExecute();
	}, [form.isDirectDeposit, handleDirectDeposit, handleBridgeExecute]);

	// ── Derived display values ──

	const selectedBridgeName = useMemo(
		() => form.selectedRoute?.steps[0]?.toolDetails.name ?? undefined,
		[form.selectedRoute],
	);

	const selectedChainName = useMemo(
		() => (form.selectedChainId ? getChainName(form.selectedChainId) : ''),
		[form.selectedChainId],
	);

	const destinationChainName = useMemo(
		() => getChainName(config.destinationChainId),
		[config.destinationChainId],
	);

	const resetDeposit = useCallback(() => {
		setDepositStatus('idle');
		form.setAmount('');
		form.refetchTokens();
	}, [form.setAmount, form.refetchTokens]);

	const resetBridge = useCallback(() => {
		bridgeExecution.reset();
		form.setAmount('');
		form.refetchTokens();
	}, [bridgeExecution.reset, form.setAmount, form.refetchTokens]);

	return {
		form,
		isSpinning,
		depositStatus,
		bridgeExecution,
		selectedBridgeName,
		selectedChainName,
		destinationChainName,
		handleRefresh,
		handleExecute,
		resetDeposit,
		resetBridge,
	};
}
