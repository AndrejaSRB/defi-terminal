import { useState, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { activeNormalizerAtom, activeDexExchangeAtom } from '@/atoms/dex';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { useWalletSigner } from '@/hooks/use-wallet-signer';
import { classifyTxError } from '@/lib/tx-errors';
import { useDepositBalance } from '@/components/panels/deposit/hooks/use-deposit-balance';

export function useWithdraw() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const exchange = useAtomValue(activeDexExchangeAtom);
	const walletAddress = useAtomValue(walletAddressAtom);
	const { sign } = useWalletSigner();
	const { balance, isLoading: isLoadingBalance } = useDepositBalance();

	const { withdrawConfig } = normalizer;

	const [amount, setAmount] = useState('');
	const [destination, setDestination] = useState('');
	const [isWithdrawing, setIsWithdrawing] = useState(false);

	// Use connected wallet as default destination
	const effectiveDestination = destination || walletAddress || '';

	const parsedAmount = Number(amount);
	const isValidAmount =
		parsedAmount >= withdrawConfig.minWithdraw && parsedAmount <= balance;
	const receiveAmount =
		parsedAmount > 0 ? parsedAmount - withdrawConfig.fee : 0;

	const amountError =
		parsedAmount > 0 && parsedAmount > balance
			? 'Insufficient balance'
			: parsedAmount > 0 && parsedAmount < withdrawConfig.minWithdraw
				? `Minimum withdrawal is ${withdrawConfig.minWithdraw} ${withdrawConfig.tokenSymbol}`
				: null;

	const handleMaxClick = useCallback(() => {
		setAmount(balance.toString());
	}, [balance]);

	const handleWithdraw = useCallback(async () => {
		if (!isValidAmount || !effectiveDestination) return;
		if (!exchange) {
			toast.error('Trading not available for this DEX');
			return;
		}

		setIsWithdrawing(true);
		try {
			const result = await exchange.withdraw({
				amount: parsedAmount,
				destination: effectiveDestination,
				sign,
			});

			if (result.status === 'success') {
				toast.success('Withdrawal submitted', {
					description: `${receiveAmount.toFixed(2)} ${withdrawConfig.tokenSymbol} will arrive in ${withdrawConfig.estimatedTime}`,
				});
				setAmount('');
			} else {
				toast.error(result.message);
			}
		} catch (withdrawError) {
			const classified = classifyTxError(withdrawError);
			console.error('[Withdraw] Error:', classified.type, withdrawError);
			toast.error(classified.message);
		} finally {
			setIsWithdrawing(false);
		}
	}, [
		isValidAmount,
		effectiveDestination,
		parsedAmount,
		receiveAmount,
		exchange,
		sign,
		withdrawConfig,
	]);

	return {
		// State
		amount,
		destination,
		effectiveDestination,
		isWithdrawing,
		isLoadingBalance,
		// Derived
		balance,
		parsedAmount,
		isValidAmount,
		receiveAmount,
		amountError,
		withdrawConfig,
		dexName: normalizer.name,
		// Actions
		setAmount,
		setDestination,
		handleMaxClick,
		handleWithdraw,
	};
}
