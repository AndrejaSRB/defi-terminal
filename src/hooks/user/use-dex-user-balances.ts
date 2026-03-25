import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { userPerpsBalancesAtom, userMarginAtom } from '@/atoms/user/balances';
import { useAuth } from '../use-auth';

export function useDexUserBalances() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const { walletAddress } = useAuth();
	const setBalances = useSetAtom(userPerpsBalancesAtom);
	const setMargin = useSetAtom(userMarginAtom);

	useEffect(() => {
		if (!walletAddress) {
			setBalances([]);
			setMargin(null);
			return;
		}

		if (!normalizer.channels.userBalances || !normalizer.parseUserBalances)
			return;

		const channel = normalizer.channels.userBalances(walletAddress);
		const parse = normalizer.parseUserBalances;

		const unsub = tradingWs.subscribe(channel, (raw) => {
			const { margin, balances } = parse(raw);
			setMargin(margin);
			setBalances(balances);
		});

		return unsub;
	}, [normalizer, walletAddress, setBalances, setMargin]);
}
