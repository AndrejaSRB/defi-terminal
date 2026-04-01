/**
 * REST hook for fetching leverage per market.
 *
 * Fetches on token change (not polling) via normalizer.fetchUserLeverage.
 * Only active when the normalizer provides the method and user is connected.
 */

import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useQuery } from '@tanstack/react-query';
import { safeParseFloat } from '@/lib/numbers';
import { activeNormalizerAtom } from '@/atoms/dex';
import { activeTokenAtom } from '@/atoms/active-token';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { userTradingContextAtom } from '@/atoms/user/trading-context';
import { userMarginAtom } from '@/atoms/user/balances';

export function useDexUserLeverage() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const walletAddress = useAtomValue(walletAddressAtom);
	const token = useAtomValue(activeTokenAtom);
	const margin = useAtomValue(userMarginAtom);
	const setTradingContext = useSetAtom(userTradingContextAtom);

	const hasRestLeverage = !!normalizer.fetchUserLeverage;

	const { data: leverage } = useQuery({
		queryKey: ['dex-user-leverage', normalizer.name, walletAddress, token],
		queryFn: () => normalizer.fetchUserLeverage!(walletAddress!, token),
		enabled: hasRestLeverage && !!walletAddress,
		retry: false,
	});

	// Combine leverage with balance data for trading context
	const availableToTrade = margin ? safeParseFloat(margin.withdrawable) : 0;

	useEffect(() => {
		if (leverage === undefined) return;
		setTradingContext({
			coin: token,
			leverage,
			marginMode: 'cross',
			maxTradeSzBuy: 0,
			maxTradeSzSell: 0,
			availableToTradeBuy: availableToTrade,
			availableToTradeSell: availableToTrade,
		});
	}, [leverage, token, availableToTrade, setTradingContext]);
}
