import { useEffect, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { userOpenOrdersAtom } from '@/atoms/user/orders';
import { useAuth } from '../use-auth';

export function useDexUserOrders() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const { walletAddress } = useAuth();
	const setOrders = useSetAtom(userOpenOrdersAtom);

	const handleData = useCallback(
		(raw: unknown) => {
			setOrders(normalizer.parseUserOpenOrders(raw));
		},
		[normalizer, setOrders],
	);

	const handleReconnect = useCallback(() => {
		normalizer
			.fetchUserOpenOrders?.(walletAddress!)
			.then(setOrders)
			.catch(() => {});
	}, [normalizer, walletAddress, setOrders]);

	useEffect(() => {
		if (!walletAddress || !normalizer.channels.userOpenOrders) {
			setOrders([]);
			return;
		}

		const channel = normalizer.channels.userOpenOrders(walletAddress);
		const unsub = tradingWs.subscribe(channel, handleData, {
			onReconnect: handleReconnect,
		});

		return unsub;
	}, [normalizer, walletAddress, setOrders, handleData, handleReconnect]);
}
