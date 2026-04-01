/**
 * Withdrawal action hook — orchestrates quote → commit → sign → submit.
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
	getBridgeQuote,
	commitBridgeQuote,
} from '@/normalizer/extended/services/bridge-api';
import { submitWithdrawal } from '@/normalizer/extended/services/withdrawal-api';
import { getStoredAccount } from '@/normalizer/extended/utils/storage';
import type { ChainMeta } from '@/normalizer/extended/services/bridge-types';

export type WithdrawStatus =
	| 'idle'
	| 'quoting'
	| 'committing'
	| 'signing'
	| 'submitting'
	| 'success'
	| 'error';

interface UseExtendedWithdrawActionParams {
	walletAddress: string | null;
	chainMeta: ChainMeta | undefined;
	selectedChain: string;
}

export function useExtendedWithdrawAction({
	walletAddress,
	chainMeta,
	selectedChain,
}: UseExtendedWithdrawActionParams) {
	const [status, setStatus] = useState<WithdrawStatus>('idle');
	const executingRef = useRef(false);

	const execute = useCallback(
		async (amount: number) => {
			if (!walletAddress || !chainMeta) {
				toast.error('Missing withdrawal configuration');
				return;
			}
			if (executingRef.current) return;
			executingRef.current = true;

			const account = getStoredAccount(walletAddress);
			if (!account?.apiKey) {
				toast.error('Not onboarded — please enable trading first');
				executingRef.current = false;
				return;
			}

			try {
				// 1. Get bridge quote (STRK → EVM chain)
				setStatus('quoting');
				const quote = await getBridgeQuote(
					account.apiKey,
					'STRK',
					amount,
					selectedChain,
				);

				// 2. Commit the quote
				setStatus('committing');
				await commitBridgeQuote(account.apiKey, quote.id);

				// 3. Sign + submit withdrawal
				setStatus('signing');
				await submitWithdrawal({
					walletAddress,
					amount,
					chainId: selectedChain,
					quoteId: quote.id,
				});

				setStatus('success');
				toast.success('Withdrawal Submitted', {
					description: `Your ${amount} USDC withdrawal to ${chainMeta.name} is being processed. Est. arrival: ~2-20 min.`,
				});
			} catch (error) {
				setStatus('error');
				const message =
					error instanceof Error ? error.message : 'Withdrawal failed';
				toast.error(message);
			} finally {
				executingRef.current = false;
			}
		},
		[walletAddress, chainMeta, selectedChain],
	);

	const reset = useCallback(() => setStatus('idle'), []);

	return { execute, status, reset };
}
