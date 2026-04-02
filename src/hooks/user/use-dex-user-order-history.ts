import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { userOrderHistoryAtom } from '@/atoms/user/order-history';
import { activeRecordsTabAtom } from '@/atoms/ui/records-tab';
import { useAuth } from '../use-auth';

const MAX_ORDERS = 500;

export function useDexUserOrderHistory() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const { walletAddress } = useAuth();
	const setOrders = useSetAtom(userOrderHistoryAtom);
	const activeTab = useAtomValue(activeRecordsTabAtom);

	useEffect(() => {
		if (!walletAddress) {
			setOrders([]);
			return;
		}

		// WS path — HL
		if (
			normalizer.channels.userHistoricalOrders &&
			normalizer.parseHistoricalOrders
		) {
			const channel = normalizer.channels.userHistoricalOrders(walletAddress);
			const parse = normalizer.parseHistoricalOrders;
			let hasSnapshot = false;

			const unsub = tradingWs.subscribe(channel, (raw) => {
				const wsData = raw as {
					isSnapshot?: boolean;
					orderHistory?: unknown[];
				};
				const orders = parse(wsData.orderHistory ?? raw);

				if (wsData.isSnapshot || !hasSnapshot) {
					hasSnapshot = true;
					setOrders(orders.reverse().slice(0, MAX_ORDERS));
				} else {
					setOrders((prev) => [...orders, ...prev].slice(0, MAX_ORDERS));
				}
			});

			return unsub;
		}

		// REST fallback — Extended (refetch on tab activation)
		if (normalizer.fetchOrderHistory) {
			normalizer
				.fetchOrderHistory(walletAddress, MAX_ORDERS)
				.then((orders) => setOrders(orders))
				.catch(() => setOrders([]));
		}
	}, [normalizer, walletAddress, setOrders, activeTab]);
}
