import { useCallback } from 'react';
import { useAtomValue, useStore } from 'jotai';
import { atom } from 'jotai';
import { toast } from 'sonner';
import { activeDexExchangeAtom } from '@/atoms/dex';
import { userOpenOrdersAtom } from '@/atoms/user/orders';
import {
	walletAddressAtom,
	onboardingBlockerAtom,
} from '@/atoms/user/onboarding';
import { tradingWs } from '@/services/ws';

export const isProcessingOrderAtom = atom<boolean>(false);

export function useOrderActions() {
	const store = useStore();
	const isProcessing = useAtomValue(isProcessingOrderAtom);

	const checkAgent = useCallback((): boolean => {
		const blocker = store.get(onboardingBlockerAtom);
		if (blocker) {
			toast.error('Please enable trading first');
			return false;
		}
		return true;
	}, [store]);

	const cancelOrder = useCallback(
		async (orderId: number, coin: string) => {
			if (!checkAgent()) return;
			if (store.get(isProcessingOrderAtom)) return;
			store.set(isProcessingOrderAtom, true);

			const address = store.get(walletAddressAtom) ?? '';
			store.get(activeDexExchangeAtom).setWalletAddress(address);

			try {
				const exchange = store.get(activeDexExchangeAtom);
				await exchange.cancelOrder({ coin, orderId }, tradingWs);
				toast.success('Order canceled');
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Cancel order failed',
				);
			} finally {
				store.set(isProcessingOrderAtom, false);
			}
		},
		[checkAgent, store],
	);

	const cancelAllOrders = useCallback(async () => {
		if (!checkAgent()) return;
		if (store.get(isProcessingOrderAtom)) return;
		store.set(isProcessingOrderAtom, true);

		const address = store.get(walletAddressAtom) ?? '';
		store.get(activeDexExchangeAtom).setWalletAddress(address);

		try {
			const exchange = store.get(activeDexExchangeAtom);
			const orders = store.get(userOpenOrdersAtom);
			const cancels = orders.map((order) => ({
				coin: order.coin,
				orderId: Number(order.id),
			}));
			await exchange.cancelOrders(cancels, tradingWs);
			toast.success('All orders canceled');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Cancel all failed');
		} finally {
			store.set(isProcessingOrderAtom, false);
		}
	}, [checkAgent, store]);

	return {
		cancelOrder,
		cancelAllOrders,
		isProcessing,
	};
}
