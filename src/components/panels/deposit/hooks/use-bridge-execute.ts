import { useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	bridgeStatusAtom,
	bridgeStepsAtom,
	bridgeTxHashAtom,
	bridgeTokenSymbolAtom,
	bridgeDestChainNameAtom,
} from '@/atoms/bridge';
import { fetchLifiQuote } from '@/services/lifi/quote';
import { fetchLifiStatus } from '@/services/lifi/status';
import {
	isNativeToken,
	checkAllowance,
	buildApproveCalldata,
} from '@/services/chains/allowance';
import { getChainName } from '@/services/chains/config';
import { classifyTxError } from '@/lib/tx-errors';
import { useWalletTransaction } from '@/hooks/use-wallet-transaction';
import { useWalletChain } from '@/hooks/use-wallet-chain';
import type { LifiQuoteResponse } from '@/services/lifi/types';
import type { DepositConfig } from '@/normalizer/normalizer';
import type { WalletToken } from '@/services/zerion/filter-positions';
import type { ExecutionStep } from '../types';

interface ExecuteParams {
	lifiQuote: LifiQuoteResponse;
	walletAddress: string;
	selectedToken: WalletToken;
	requiredChainId: number;
	depositConfig: DepositConfig;
}

function buildSteps(
	needsApproval: boolean,
	bridgeName: string,
	tokenSymbol: string,
	destChainId: number,
	destTokenSymbol: string,
): ExecutionStep[] {
	const destName = getChainName(destChainId);
	const steps: ExecutionStep[] = [];

	if (needsApproval) {
		steps.push({
			id: 'approve',
			label: 'Approve Token',
			description: `Allow bridge to use your ${tokenSymbol}`,
			status: 'active',
		});
	}

	steps.push({
		id: 'send',
		label: 'Send Transaction',
		description: 'Confirm bridge in your wallet',
		status: needsApproval ? 'pending' : 'active',
	});

	steps.push({
		id: 'bridge',
		label: `Bridge via ${bridgeName}`,
		description: 'Cross-chain transfer in progress',
		status: 'pending',
	});

	steps.push({
		id: 'arrive',
		label: `${destTokenSymbol} on ${destName}`,
		description: 'Waiting for funds to arrive',
		status: 'pending',
	});

	return steps;
}

function advanceStep(
	steps: ExecutionStep[],
	completedId: string,
	nextId: string,
): ExecutionStep[] {
	return steps.map((step) => {
		if (step.id === completedId) return { ...step, status: 'completed' };
		if (step.id === nextId) return { ...step, status: 'active' };
		return step;
	});
}

export function useBridgeExecute() {
	const status = useAtomValue(bridgeStatusAtom);
	const steps = useAtomValue(bridgeStepsAtom);
	const txHash = useAtomValue(bridgeTxHashAtom);
	const tokenSymbol = useAtomValue(bridgeTokenSymbolAtom);
	const destChainName = useAtomValue(bridgeDestChainNameAtom);

	const setStatus = useSetAtom(bridgeStatusAtom);
	const setSteps = useSetAtom(bridgeStepsAtom);
	const setTxHash = useSetAtom(bridgeTxHashAtom);
	const setTokenSymbol = useSetAtom(bridgeTokenSymbolAtom);
	const setDestChainName = useSetAtom(bridgeDestChainNameAtom);

	const { send: sendTransaction } = useWalletTransaction();
	const { isOnChain, switchChain } = useWalletChain();

	// ── Status Polling via react-query ──

	useQuery({
		queryKey: ['bridge-status', txHash],
		queryFn: () => fetchLifiStatus(txHash!),
		enabled: status === 'executing' && txHash !== null,
		refetchInterval: 5000,
		refetchIntervalInBackground: true,
		select: (data) => {
			if (!data) return null;

			if (data.status === 'PENDING') {
				setSteps((prev) =>
					prev.map((step) =>
						step.id === 'bridge'
							? {
									...step,
									status: 'active',
									description: data.substatusMessage,
								}
							: step,
					),
				);
			}

			if (data.status === 'DONE' && data.substatus === 'COMPLETED') {
				setSteps((prev) =>
					prev.map((step) => ({ ...step, status: 'completed' })),
				);
				setStatus('success');
				toast.success('Bridge complete! Funds arrived.');
			}

			if (data.status === 'DONE' && data.substatus === 'REFUNDED') {
				setSteps((prev) =>
					prev.map((step) =>
						step.id === 'bridge'
							? {
									...step,
									status: 'error',
									description: 'Refunded to your wallet',
								}
							: step,
					),
				);
				setStatus('failed');
				toast.error('Bridge failed — funds refunded');
			}

			if (data.status === 'FAILED') {
				setSteps((prev) =>
					prev.map((step) =>
						step.id === 'bridge'
							? { ...step, status: 'error', description: data.substatusMessage }
							: step,
					),
				);
				setStatus('failed');
				toast.error(`Bridge failed: ${data.substatusMessage}`);
			}

			return data;
		},
	});

	// ── Execute ──

	const execute = useCallback(
		async (params: ExecuteParams) => {
			const {
				lifiQuote,
				walletAddress,
				selectedToken,
				requiredChainId,
				depositConfig,
			} = params;

			const needsApproval = !isNativeToken(selectedToken.tokenAddress);

			setStatus('executing');
			setTokenSymbol(selectedToken.symbol);
			setDestChainName(getChainName(depositConfig.chainId));
			setTxHash(null);
			setSteps(
				buildSteps(
					needsApproval,
					lifiQuote.toolDetails.name,
					selectedToken.symbol,
					depositConfig.chainId,
					depositConfig.tokenSymbol,
				),
			);

			try {
				// Ensure wallet is on source chain
				if (!isOnChain(requiredChainId)) {
					await switchChain(requiredChainId);
				}

				// Step: Approve if ERC-20
				if (needsApproval && selectedToken.tokenAddress) {
					const allowance = await checkAllowance(
						requiredChainId,
						selectedToken.tokenAddress,
						walletAddress,
						lifiQuote.estimate.approvalAddress,
					);

					const requiredAmount = BigInt(lifiQuote.action.fromAmount);
					if (allowance < requiredAmount) {
						await sendTransaction({
							to: selectedToken.tokenAddress,
							data: buildApproveCalldata(
								lifiQuote.estimate.approvalAddress,
								requiredAmount,
							),
							chainId: requiredChainId,
						});
					}

					setSteps((prev) => advanceStep(prev, 'approve', 'send'));
				}

				// Re-fetch fresh quote (previous may have expired during approval)
				const freshQuote = await fetchLifiQuote({
					fromChain: lifiQuote.action.fromChainId,
					toChain: lifiQuote.action.toChainId,
					fromToken: lifiQuote.action.fromToken.address,
					toToken: lifiQuote.action.toToken.address,
					fromAmount: lifiQuote.action.fromAmount,
					fromAddress: walletAddress,
				});
				const txReq = freshQuote.transactionRequest;

				// Step: Send bridge transaction
				const newTxHash = await sendTransaction({
					to: txReq.to,
					data: txReq.data,
					value: BigInt(txReq.value),
					chainId: txReq.chainId,
				});

				// Store txHash → triggers react-query polling
				setTxHash(newTxHash);
				setSteps((prev) => advanceStep(prev, 'send', 'bridge'));
			} catch (execError) {
				const classified = classifyTxError(execError);
				console.error(
					'[CrossChain] Execute error:',
					classified.type,
					execError,
				);
				toast.error(classified.message);
				setStatus('idle');
			}
		},
		[
			isOnChain,
			switchChain,
			sendTransaction,
			setStatus,
			setSteps,
			setTxHash,
			setTokenSymbol,
			setDestChainName,
		],
	);

	return {
		status,
		steps,
		txHash,
		tokenSymbol,
		destChainName,
		execute,
	};
}
