import { useEffect, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { userPositionsAtom } from '@/atoms/user/positions';
import { useAuth } from '../use-auth';

export function useDexUserPositions() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const { walletAddress } = useAuth();
	const setPositions = useSetAtom(userPositionsAtom);

	const handleData = useCallback(
		(raw: unknown) => {
			setPositions(normalizer.parseUserPositions(raw));
		},
		[normalizer, setPositions],
	);

	const handleReconnect = useCallback(() => {
		normalizer
			.fetchUserPositions?.(walletAddress!)
			.then(setPositions)
			.catch(() => {});
	}, [normalizer, walletAddress, setPositions]);

	useEffect(() => {
		if (!walletAddress || !normalizer.channels.userPositions) {
			setPositions([]);
			return;
		}

		const channel = normalizer.channels.userPositions(walletAddress);
		const unsub = tradingWs.subscribe(channel, handleData, {
			onReconnect: handleReconnect,
		});

		return unsub;
	}, [normalizer, walletAddress, setPositions, handleData, handleReconnect]);
}
