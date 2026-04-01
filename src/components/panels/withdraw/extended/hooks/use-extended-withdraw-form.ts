/**
 * Form state for Extended withdrawal.
 * Manages chain selection, amount, and available balance.
 */

import { useState, useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { userMarginAtom } from '@/atoms/user/balances';
import { safeParseFloat } from '@/lib/numbers';
import { CHAIN_META } from '@/normalizer/extended/services/bridge-types';

export function useExtendedWithdrawForm() {
	const walletAddress = useAtomValue(walletAddressAtom);
	const margin = useAtomValue(userMarginAtom);

	const [selectedChain, setSelectedChain] = useState('ARB');
	const [amount, setAmount] = useState('');

	const chainMeta = CHAIN_META[selectedChain];

	// Available for withdrawal from balance data
	const availableBalance = margin ? safeParseFloat(margin.withdrawable) : 0;

	const setMax = useCallback(() => {
		if (availableBalance > 0) {
			setAmount(availableBalance.toFixed(2));
		}
	}, [availableBalance]);

	const parsedAmount = parseFloat(amount) || 0;

	const isValid = useMemo(() => {
		return parsedAmount > 0 && parsedAmount <= availableBalance;
	}, [parsedAmount, availableBalance]);

	const amountError = useMemo(() => {
		if (!amount || parsedAmount === 0) return null;
		if (parsedAmount > availableBalance) return 'Insufficient balance';
		return null;
	}, [amount, parsedAmount, availableBalance]);

	return {
		walletAddress,
		selectedChain,
		setSelectedChain,
		amount,
		setAmount,
		setMax,
		availableBalance,
		parsedAmount,
		chainMeta,
		isValid,
		amountError,
	};
}
