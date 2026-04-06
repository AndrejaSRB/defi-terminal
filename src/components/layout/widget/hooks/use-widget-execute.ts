import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { fetchStepTransaction } from '@/services/lifi/step-transaction';
import { fetchLifiStatus } from '@/services/lifi/status';
import {
	isNativeToken,
	checkAllowance,
	buildApproveCalldata,
} from '@/services/chains/allowance';
import { classifyTxError } from '@/lib/tx-errors';
import { useWalletTransaction } from '@/hooks/use-wallet-transaction';
import { useWalletChain } from '@/hooks/use-wallet-chain';
import type { Route } from '@lifi/sdk';

export type BridgeStepId = 'approve' | 'send' | 'bridge';
export type BridgeStepStatus = 'pending' | 'active' | 'completed' | 'error';
export type BridgeStatus = 'idle' | 'executing' | 'success' | 'error';

export interface BridgeStep {
	id: BridgeStepId;
	label: string;
	description: string;
	status: BridgeStepStatus;
}

const STATUS_POLL_INTERVAL = 5000;

export function useWidgetExecute() {
	const { send: sendTransaction } = useWalletTransaction();
	const { isOnChain, switchChain } = useWalletChain();

	const [status, setStatus] = useState<BridgeStatus>('idle');
	const [steps, setSteps] = useState<BridgeStep[]>([]);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const stopPolling = useCallback(() => {
		if (pollRef.current) {
			clearInterval(pollRef.current);
			pollRef.current = null;
		}
	}, []);

	// ── Poll LI.FI status until bridge completes ──

	const startPolling = useCallback(
		(hash: string) => {
			stopPolling();

			const poll = async () => {
				try {
					const result = await fetchLifiStatus(hash);

					if (result.status === 'PENDING') {
						setSteps((prev) =>
							prev.map((step) =>
								step.id === 'bridge'
									? {
											...step,
											status: 'active',
											description:
												result.substatusMessage ?? 'Bridge in progress...',
										}
									: step,
							),
						);
					}

					if (result.status === 'DONE' && result.substatus === 'COMPLETED') {
						stopPolling();
						setSteps((prev) =>
							prev.map((step) => ({ ...step, status: 'completed' })),
						);
						setStatus('success');
						toast.success('Deposit complete! Funds sent to trading account.');
					}

					if (result.status === 'DONE' && result.substatus === 'REFUNDED') {
						stopPolling();
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
						setStatus('error');
						toast.error('Bridge failed — funds refunded');
					}

					if (result.status === 'FAILED') {
						stopPolling();
						setSteps((prev) =>
							prev.map((step) =>
								step.id === 'bridge'
									? {
											...step,
											status: 'error',
											description: result.substatusMessage ?? 'Bridge failed',
										}
									: step,
							),
						);
						setStatus('error');
						toast.error(
							`Bridge failed: ${result.substatusMessage ?? 'Unknown error'}`,
						);
					}
				} catch (pollError) {
					console.warn('[Widget] Status poll failed, retrying...', pollError);
				}
			};

			poll();
			pollRef.current = setInterval(poll, STATUS_POLL_INTERVAL);
		},
		[stopPolling],
	);

	// ── Execute bridge ──

	const execute = useCallback(
		async (
			route: Route,
			sourceChainId: number,
			sourceTokenAddress: string,
			userAddress: string,
		) => {
			const firstStep = route.steps[0];
			if (!firstStep) return;

			const needsApproval = !isNativeToken(sourceTokenAddress);
			const bridgeName = firstStep.toolDetails.name;
			const tokenSymbol = firstStep.action.fromToken.symbol;

			const initialSteps: BridgeStep[] = [];
			if (needsApproval) {
				initialSteps.push({
					id: 'approve',
					label: `Approve ${tokenSymbol}`,
					description: `Allow bridge to use your ${tokenSymbol}`,
					status: 'active',
				});
			}
			initialSteps.push({
				id: 'send',
				label: 'Send Transaction',
				description: 'Confirm bridge in your wallet',
				status: needsApproval ? 'pending' : 'active',
			});
			initialSteps.push({
				id: 'bridge',
				label: `Bridge via ${bridgeName}`,
				description: 'Cross-chain transfer in progress',
				status: 'pending',
			});

			setSteps(initialSteps);
			setStatus('executing');

			try {
				if (!isOnChain(sourceChainId)) {
					await switchChain(sourceChainId);
				}

				if (needsApproval) {
					const approvalAddress = firstStep.estimate.approvalAddress;
					const requiredAmount = BigInt(firstStep.action.fromAmount);

					const allowance = await checkAllowance(
						sourceChainId,
						sourceTokenAddress,
						userAddress,
						approvalAddress,
					);

					if (allowance < requiredAmount) {
						await sendTransaction({
							to: sourceTokenAddress,
							data: buildApproveCalldata(approvalAddress, requiredAmount),
							chainId: sourceChainId,
						});
					}

					setSteps((prev) =>
						prev.map((step) => {
							if (step.id === 'approve')
								return { ...step, status: 'completed' };
							if (step.id === 'send') return { ...step, status: 'active' };
							return step;
						}),
					);
				}

				const freshStep = await fetchStepTransaction(firstStep);
				const txRequest = freshStep.transactionRequest;
				if (!txRequest?.to) {
					throw new Error('No transaction data returned');
				}

				const hash = await sendTransaction({
					to: txRequest.to,
					data: txRequest.data,
					value: txRequest.value ? BigInt(txRequest.value) : undefined,
					chainId: sourceChainId,
				});

				setSteps((prev) =>
					prev.map((step) => {
						if (step.id === 'send') return { ...step, status: 'completed' };
						if (step.id === 'bridge') return { ...step, status: 'active' };
						return step;
					}),
				);

				startPolling(hash);
			} catch (executeError) {
				const classified = classifyTxError(executeError);
				console.error('[Widget] Bridge error:', classified.type, executeError);
				toast.error(classified.message);
				setSteps((prev) =>
					prev.map((step) =>
						step.status === 'active' ? { ...step, status: 'error' } : step,
					),
				);
				setStatus('error');
			}
		},
		[isOnChain, switchChain, sendTransaction, startPolling],
	);

	const reset = useCallback(() => {
		stopPolling();
		setStatus('idle');
		setSteps([]);
	}, [stopPolling]);

	return {
		status,
		steps,
		execute,
		reset,
	};
}
