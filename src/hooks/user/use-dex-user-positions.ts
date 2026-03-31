import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { userPositionsAtom } from '@/atoms/user/positions';
import { useAuth } from '../use-auth';

export function useDexUserPositions() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const { walletAddress } = useAuth();
	const setPositions = useSetAtom(userPositionsAtom);

	useEffect(() => {
		if (!walletAddress || !normalizer.channels.userPositions) {
			setPositions([]);
			return;
		}

		const channel = normalizer.channels.userPositions(walletAddress);
		const unsub = tradingWs.subscribe(channel, (raw) => {
			setPositions(normalizer.parseUserPositions(raw));
		});

		return unsub;
	}, [normalizer, walletAddress, setPositions]);
}
