import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { userSpotBalancesAtom } from '@/atoms/user/balances';
import { useAuth } from '../use-auth';

export function useDexUserSpot() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const { walletAddress } = useAuth();
	const setSpot = useSetAtom(userSpotBalancesAtom);

	useEffect(() => {
		if (!walletAddress) {
			setSpot([]);
			return;
		}

		if (!normalizer.channels.spotState || !normalizer.parseSpotBalances) return;

		const channel = normalizer.channels.spotState(walletAddress);
		const parse = normalizer.parseSpotBalances;

		const unsub = tradingWs.subscribe(channel, (raw) => {
			setSpot(parse(raw));
		});

		return unsub;
	}, [normalizer, walletAddress, setSpot]);
}
