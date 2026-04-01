/**
 * REST polling hook for DEXes without private WS (e.g. Extended).
 *
 * Polls balance + positions together every 5s via normalizer.fetchUserData.
 * Only active when the normalizer provides the method and user is connected.
 * Writes into existing atoms so the form/UI stays unchanged.
 */

import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useQuery } from '@tanstack/react-query';
import { activeNormalizerAtom } from '@/atoms/dex';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { userMarginAtom, userPerpsBalancesAtom } from '@/atoms/user/balances';
import { userPositionsAtom } from '@/atoms/user/positions';
import { userOpenOrdersAtom } from '@/atoms/user/orders';

const POLL_INTERVAL = 5_000;

export function useDexUserData() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const walletAddress = useAtomValue(walletAddressAtom);
	const setMargin = useSetAtom(userMarginAtom);
	const setPositions = useSetAtom(userPositionsAtom);
	const setOpenOrders = useSetAtom(userOpenOrdersAtom);
	const setPerpsBalances = useSetAtom(userPerpsBalancesAtom);

	const hasRestPolling = !!normalizer.fetchUserData;

	const { data } = useQuery({
		queryKey: ['dex-user-data', normalizer.name, walletAddress],
		queryFn: () => normalizer.fetchUserData!(walletAddress!),
		enabled: hasRestPolling && !!walletAddress,
		refetchInterval: POLL_INTERVAL,
		retry: false,
	});

	useEffect(() => {
		if (!data) return;
		if (data.balance) setMargin(data.balance);
		setPositions(data.positions);
		setOpenOrders(data.openOrders);
		setPerpsBalances(data.perpsBalances);
	}, [data, setMargin, setPositions, setOpenOrders, setPerpsBalances]);
}
