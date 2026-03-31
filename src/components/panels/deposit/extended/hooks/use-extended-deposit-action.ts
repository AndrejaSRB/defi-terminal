/**
 * Deposit action hook — orchestrates commit → approve → deposit.
 *
 * Handles the full on-chain deposit flow after the user confirms the quote.
 */

import { useState, useCallback, useRef } from 'react';
import { encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import { toast } from 'sonner';
import { useWalletTransaction } from '@/hooks/use-wallet-transaction';
import { useWalletChain } from '@/hooks/use-wallet-chain';
import { commitBridgeQuote } from '@/normalizer/extended/services/bridge-api';
import { buildDepositData } from '@/normalizer/extended/services/bridge-deposit';
import { checkAllowance } from '@/services/chains/allowance';
import type {
	BridgeQuote,
	ChainMeta,
} from '@/normalizer/extended/services/bridge-types';

export type DepositStatus =
	| 'idle'
	| 'committing'
	| 'approving'
	| 'depositing'
	| 'success'
	| 'error';

interface UseExtendedDepositActionParams {
	apiKey: string;
	walletAddress: string | null;
	chainMeta: ChainMeta | undefined;
	bridgeContract: string;
}

export function useExtendedDepositAction({
	apiKey,
	walletAddress,
	chainMeta,
	bridgeContract,
}: UseExtendedDepositActionParams) {
	const [status, setStatus] = useState<DepositStatus>('idle');
	const executingRef = useRef(false);
	const { send: sendTransaction } = useWalletTransaction();
	const { isOnChain, switchChain } = useWalletChain();

	const execute = useCallback(
		async (quote: BridgeQuote, amount: number) => {
			if (!walletAddress || !chainMeta || !bridgeContract) {
				toast.error('Missing deposit configuration');
				return;
			}
			if (executingRef.current) return;
			executingRef.current = true;

			try {
				// 1. Commit the quote — Rhino starts watching for the deposit
				setStatus('committing');
				await commitBridgeQuote(apiKey, quote.id);

				// 2. Switch chain if needed
				if (!isOnChain(chainMeta.chainId)) {
					setStatus('approving');
					await switchChain(chainMeta.chainId);
				}

				// 3. Check allowance and approve if needed
				setStatus('approving');
				const depositAmount = parseUnits(String(amount), 6);
				const currentAllowance = await checkAllowance(
					chainMeta.chainId,
					chainMeta.usdcAddress,
					walletAddress,
					bridgeContract,
				);

				if (currentAllowance < depositAmount) {
					const approveData = encodeFunctionData({
						abi: erc20Abi,
						functionName: 'approve',
						args: [bridgeContract as `0x${string}`, depositAmount],
					});

					// Privy's sendTransaction waits for tx to be mined
					await sendTransaction({
						to: chainMeta.usdcAddress,
						data: approveData,
						chainId: chainMeta.chainId,
					});
				}

				// 4. Execute depositWithId
				setStatus('depositing');
				const depositTx = buildDepositData(
					bridgeContract,
					chainMeta,
					amount,
					quote.id,
				);

				await sendTransaction({
					to: depositTx.to,
					data: depositTx.data,
					chainId: depositTx.chainId,
				});

				setStatus('success');
				toast.success('Deposit Submitted', {
					description: `Your ${amount} USDC deposit from ${chainMeta.name} is being processed. Funds will arrive in ~2 min.`,
				});
			} catch (error) {
				setStatus('error');
				const message =
					error instanceof Error ? error.message : 'Deposit failed';
				toast.error(message);
			} finally {
				executingRef.current = false;
			}
		},
		[
			apiKey,
			walletAddress,
			chainMeta,
			bridgeContract,
			sendTransaction,
			isOnChain,
			switchChain,
		],
	);

	const reset = useCallback(() => setStatus('idle'), []);

	return { execute, status, reset };
}
