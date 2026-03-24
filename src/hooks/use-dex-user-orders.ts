import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { userOpenOrdersAtom } from '@/atoms/user/orders';
import { useAuth } from './use-auth';

export function useDexUserOrders() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const { walletAddress } = useAuth();
	const setOrders = useSetAtom(userOpenOrdersAtom);

	useEffect(() => {
		if (!walletAddress) {
			setOrders([]);
			return;
		}

		const channel = normalizer.channels.userOpenOrders(walletAddress);
		const unsub = tradingWs.subscribe(channel, (raw) => {
			setOrders(normalizer.parseUserOpenOrders(raw));
		});

		return unsub;
	}, [normalizer, walletAddress, setOrders]);
}
