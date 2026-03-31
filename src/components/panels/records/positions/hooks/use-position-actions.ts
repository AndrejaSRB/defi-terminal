import { useCallback } from 'react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { toast } from 'sonner';
import { activeDexExchangeAtom } from '@/atoms/dex';
import { pricesAtom } from '@/atoms/prices';
import { userPositionsAtom } from '@/atoms/user/positions';
import {
	walletAddressAtom,
	onboardingBlockerAtom,
} from '@/atoms/user/onboarding';

import { safeParseFloat } from '@/lib/numbers';
import type { FormattedPosition } from './use-positions-data';
import {
	activePositionActionAtom,
	skipMarketCloseConfirmAtom,
	skipReverseConfirmAtom,
	isClosingPositionAtom,
	type PositionActionData,
} from '../atoms/position-actions-atoms';

export function usePositionActions() {
	const store = useStore();
	const isClosing = useAtomValue(isClosingPositionAtom);
	const setAction = useSetAtom(activePositionActionAtom);
	const setIsClosing = useSetAtom(isClosingPositionAtom);

	// Agent gate — all actions must check this first
	const checkAgent = useCallback((): boolean => {
		const blocker = store.get(onboardingBlockerAtom);
		if (blocker) {
			toast.error('Please enable trading first');
			return false;
		}
		return true;
	}, [store]);

	const openLimitClose = useCallback(
		(position: FormattedPosition) => {
			if (!checkAgent()) return;
			setAction({
				coin: position.coin,
				side: position.side,
				size: position.rawSize,
				entryPrice: position.rawEntryPrice,
				markPrice: position.rawMarkPrice,
				leverage: position.leverage,
				type: 'limit',
			});
		},
		[checkAgent, setAction],
	);

	const executeMarketClose = useCallback(
		async (data: PositionActionData) => {
			if (!checkAgent()) return;
			if (store.get(isClosingPositionAtom)) return;

			const exchange = store.get(activeDexExchangeAtom);
			if (!exchange) {
				toast.error('Trading not available for this DEX');
				return;
			}

			setIsClosing(true);
			const address = store.get(walletAddressAtom) ?? '';
			exchange.setWalletAddress(address);

			try {
				const prices = store.get(pricesAtom);
				const markPrice = safeParseFloat(prices[data.coin]);
				// Close side is opposite of position side
				const closeSide = data.side === 'LONG' ? 'sell' : 'buy';

				const result = await exchange.placeOrder({
					coin: data.coin,
					side: closeSide,
					type: 'market',
					price: markPrice,
					size: data.size,
					reduceOnly: true,
					tif: 'Ioc',
				});

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
		[checkAgent, store, setIsClosing, setAction],
	);

	const openMarketClose = useCallback(
		(position: FormattedPosition) => {
			if (!checkAgent()) return;
			const skipConfirm = store.get(skipMarketCloseConfirmAtom);
			const data: PositionActionData = {
				coin: position.coin,
				side: position.side,
				size: position.rawSize,
				entryPrice: position.rawEntryPrice,
				markPrice: position.rawMarkPrice,
				leverage: position.leverage,
				type: 'market',
			};

			if (skipConfirm) {
				executeMarketClose(data);
			} else {
				setAction(data);
			}
		},
		[checkAgent, store, setAction, executeMarketClose],
	);

	const executeReverse = useCallback(async () => {
		const data = store.get(activePositionActionAtom);
		if (!data || store.get(isClosingPositionAtom)) return;

		const exchange = store.get(activeDexExchangeAtom);
		if (!exchange) {
			toast.error('Trading not available for this DEX');
			return;
		}

		setIsClosing(true);
		const address = store.get(walletAddressAtom) ?? '';
		exchange.setWalletAddress(address);

		try {
			const prices = store.get(pricesAtom);
			const markPrice = safeParseFloat(prices[data.coin]);
			const reverseSide = data.side === 'LONG' ? 'sell' : 'buy';

			const result = await exchange.placeOrder({
				coin: data.coin,
				side: reverseSide as 'buy' | 'sell',
				type: 'market',
				price: markPrice,
				size: data.size * 2,
				reduceOnly: false,
				tif: 'Ioc',
			});

			if (result.status === 'success') {
				toast.success(`Position reversed: ${data.coin}`);
			} else {
				toast.error(result.message ?? 'Reverse failed');
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Reverse position failed',
			);
		} finally {
			setIsClosing(false);
			setAction(null);
		}
	}, [store, setIsClosing, setAction]);

	const reversePosition = useCallback(
		(position: FormattedPosition) => {
			if (!checkAgent()) return;
			const data: PositionActionData = {
				coin: position.coin,
				side: position.side,
				size: position.rawSize,
				entryPrice: position.rawEntryPrice,
				markPrice: position.rawMarkPrice,
				leverage: position.leverage,
				type: 'reverse',
			};

			const skipConfirm = store.get(skipReverseConfirmAtom);
			if (skipConfirm) {
				setAction(data);
				executeReverse();
			} else {
				setAction(data);
			}
		},
		[checkAgent, store, setAction, executeReverse],
	);

	const closeAllPositions = useCallback(async () => {
		if (!checkAgent()) return;
		if (store.get(isClosingPositionAtom)) return;

		const exchange = store.get(activeDexExchangeAtom);
		if (!exchange) {
			toast.error('Trading not available for this DEX');
			return;
		}

		setIsClosing(true);
		const address = store.get(walletAddressAtom) ?? '';
		exchange.setWalletAddress(address);

		try {
			const positions = store.get(userPositionsAtom);
			const prices = store.get(pricesAtom);

			const results = await Promise.allSettled(
				positions.map((position) => {
					const size = safeParseFloat(position.size);
					const markPrice = safeParseFloat(prices[position.coin]);
					const closeSide = position.side === 'LONG' ? 'sell' : 'buy';

					return exchange.placeOrder({
						coin: position.coin,
						side: closeSide as 'buy' | 'sell',
						type: 'market',
						price: markPrice,
						size,
						reduceOnly: true,
						tif: 'Ioc',
					});
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
	}, [checkAgent, store, setIsClosing]);

	const openTpslEdit = useCallback(
		(position: FormattedPosition) => {
			if (!checkAgent()) return;
			setAction({
				coin: position.coin,
				side: position.side,
				size: position.rawSize,
				entryPrice: position.rawEntryPrice,
				markPrice: position.rawMarkPrice,
				leverage: position.leverage,
				type: 'tpsl',
				tpOrderId: position.tpOrderId,
				slOrderId: position.slOrderId,
				tpPrice: position.rawTpPrice,
				slPrice: position.rawSlPrice,
			});
		},
		[checkAgent, setAction],
	);

	return {
		openLimitClose,
		openMarketClose,
		reversePosition,
		executeReverse,
		closeAllPositions,
		executeMarketClose,
		openTpslEdit,
		isClosing,
	};
}
