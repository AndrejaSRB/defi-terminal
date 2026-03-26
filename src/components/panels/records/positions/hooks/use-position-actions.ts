import { useCallback } from 'react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { toast } from 'sonner';
import { activeDexExchangeAtom } from '@/atoms/dex';
import { pricesAtom } from '@/atoms/prices';
import { userPositionsAtom } from '@/atoms/user/positions';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { tradingWs } from '@/services/ws';
import { setActiveWalletAddress } from '@/normalizer/hyperliquid/exchange';
import { safeParseFloat } from '@/lib/numbers';
import {
	activePositionActionAtom,
	skipMarketCloseConfirmAtom,
	isClosingPositionAtom,
	type PositionActionData,
} from '../atoms/position-actions-atoms';

export function usePositionActions() {
	const store = useStore();
	const isClosing = useAtomValue(isClosingPositionAtom);
	const setAction = useSetAtom(activePositionActionAtom);
	const setIsClosing = useSetAtom(isClosingPositionAtom);

	const openLimitClose = useCallback(
		(position: {
			coin: string;
			side: 'LONG' | 'SHORT';
			rawSize: number;
			rawEntryPrice: number;
		}) => {
			setAction({
				coin: position.coin,
				side: position.side,
				size: position.rawSize,
				entryPrice: position.rawEntryPrice,
				type: 'limit',
			});
		},
		[setAction],
	);

	const executeMarketClose = useCallback(
		async (data: PositionActionData) => {
			if (store.get(isClosingPositionAtom)) return;
			setIsClosing(true);

			const address = store.get(walletAddressAtom) ?? '';
			setActiveWalletAddress(address);

			try {
				const exchange = store.get(activeDexExchangeAtom);
				const prices = store.get(pricesAtom);
				const markPrice = safeParseFloat(prices[data.coin]);
				// Close side is opposite of position side
				const closeSide = data.side === 'LONG' ? 'sell' : 'buy';

				const result = await exchange.placeOrder(
					{
						coin: data.coin,
						side: closeSide,
						type: 'market',
						price: markPrice,
						size: data.size,
						reduceOnly: true,
						tif: 'Ioc',
					},
					tradingWs,
				);

				if (result.status === 'success') {
					toast.success(`Position closed: ${data.coin}`);
				} else {
					toast.error(result.message ?? 'Close failed');
				}
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Close position failed',
				);
			} finally {
				setIsClosing(false);
				setAction(null);
			}
		},
		[store, setIsClosing, setAction],
	);

	const openMarketClose = useCallback(
		(position: {
			coin: string;
			side: 'LONG' | 'SHORT';
			rawSize: number;
			rawEntryPrice: number;
		}) => {
			const skipConfirm = store.get(skipMarketCloseConfirmAtom);
			const data: PositionActionData = {
				coin: position.coin,
				side: position.side,
				size: position.rawSize,
				entryPrice: position.rawEntryPrice,
				type: 'market',
			};

			if (skipConfirm) {
				executeMarketClose(data);
			} else {
				setAction(data);
			}
		},
		[store, setAction, executeMarketClose],
	);

	const reversePosition = useCallback(
		async (position: {
			coin: string;
			side: 'LONG' | 'SHORT';
			rawSize: number;
		}) => {
			if (store.get(isClosingPositionAtom)) return;
			setIsClosing(true);

			const address = store.get(walletAddressAtom) ?? '';
			setActiveWalletAddress(address);

			try {
				const exchange = store.get(activeDexExchangeAtom);
				const prices = store.get(pricesAtom);
				const markPrice = safeParseFloat(prices[position.coin]);
				// Reverse: opposite side, 2x size (close current + open new)
				const reverseSide = position.side === 'LONG' ? 'sell' : 'buy';

				const result = await exchange.placeOrder(
					{
						coin: position.coin,
						side: reverseSide,
						type: 'market',
						price: markPrice,
						size: position.rawSize * 2,
						reduceOnly: false,
						tif: 'Ioc',
					},
					tradingWs,
				);

				if (result.status === 'success') {
					toast.success(`Position reversed: ${position.coin}`);
				} else {
					toast.error(result.message ?? 'Reverse failed');
				}
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Reverse position failed',
				);
			} finally {
				setIsClosing(false);
			}
		},
		[store, setIsClosing],
	);

	const closeAllPositions = useCallback(async () => {
		if (store.get(isClosingPositionAtom)) return;
		setIsClosing(true);

		const address = store.get(walletAddressAtom) ?? '';
		setActiveWalletAddress(address);

		try {
			const exchange = store.get(activeDexExchangeAtom);
			const positions = store.get(userPositionsAtom);
			const prices = store.get(pricesAtom);

			const results = await Promise.allSettled(
				positions.map((position) => {
					const size = safeParseFloat(position.size);
					const markPrice = safeParseFloat(prices[position.coin]);
					const closeSide = position.side === 'LONG' ? 'sell' : 'buy';

					return exchange.placeOrder(
						{
							coin: position.coin,
							side: closeSide as 'buy' | 'sell',
							type: 'market',
							price: markPrice,
							size,
							reduceOnly: true,
							tif: 'Ioc',
						},
						tradingWs,
					);
				}),
			);

			const failed = results.filter((r) => r.status === 'rejected').length;
			if (failed > 0) {
				toast.error(`${failed} position(s) failed to close`);
			} else {
				toast.success('All positions closed');
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Close all failed');
		} finally {
			setIsClosing(false);
		}
	}, [store, setIsClosing]);

	return {
		openLimitClose,
		openMarketClose,
		reversePosition,
		closeAllPositions,
		executeMarketClose,
		isClosing,
	};
}
