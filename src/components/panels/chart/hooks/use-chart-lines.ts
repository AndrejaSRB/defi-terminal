import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';
import { userPositionsAtom } from '@/atoms/user/positions';
import { userOpenOrdersAtom } from '@/atoms/user/orders';
import { ChartLineManager } from '../utils/chart-lines';
import type { IChartingLibraryWidget } from '@charting_library/charting_library';
import type { Position, OpenOrder } from '@/normalizer/types';

const SYNC_DEBOUNCE_MS = 300;

/** Serialize positions/orders to a string for shallow comparison */
function positionsKey(positions: Position[], token: string): string {
	return positions
		.filter((position) => {
			const coin = position.coin.includes(':')
				? position.coin.split(':')[1]
				: position.coin;
			return coin === token;
		})
		.map(
			(position) =>
				`${position.coin}:${position.entryPrice}:${position.size}:${position.side}:${position.liquidationPrice}`,
		)
		.join('|');
}

function ordersKey(orders: OpenOrder[], token: string): string {
	return orders
		.filter((order) => {
			const coin = order.coin.includes(':')
				? order.coin.split(':')[1]
				: order.coin;
			return coin === token;
		})
		.map(
			(order) =>
				`${order.id}:${order.price}:${order.triggerPrice}:${order.isPositionTpsl}:${order.orderType}`,
		)
		.join('|');
}

export function useChartLines(
	widgetRef: React.RefObject<IChartingLibraryWidget | null>,
	isReady: boolean,
): void {
	const managerRef = useRef<ChartLineManager | null>(null);
	const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const prevPosKeyRef = useRef('');
	const prevOrdKeyRef = useRef('');
	const activeToken = useAtomValue(activeTokenAtom);
	const positions = useAtomValue(userPositionsAtom);
	const orders = useAtomValue(userOpenOrdersAtom);

	if (!managerRef.current) {
		managerRef.current = new ChartLineManager();
	}

	// Debounced sync — only when data actually changes
	useEffect(() => {
		if (!isReady || !widgetRef.current || !managerRef.current) return;

		const newPosKey = positionsKey(positions, activeToken);
		const newOrdKey = ordersKey(orders, activeToken);

		// Skip if nothing changed
		if (
			newPosKey === prevPosKeyRef.current &&
			newOrdKey === prevOrdKeyRef.current
		) {
			return;
		}

		// Debounce to batch rapid updates
		if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
		syncTimerRef.current = setTimeout(() => {
			if (!widgetRef.current || !managerRef.current) return;

			const chart = widgetRef.current.activeChart();
			const manager = managerRef.current;

			const tokenPositions = positions.filter((position) => {
				const coin = position.coin.includes(':')
					? position.coin.split(':')[1]
					: position.coin;
				return coin === activeToken;
			});

			const tokenOrders = orders.filter((order) => {
				const coin = order.coin.includes(':')
					? order.coin.split(':')[1]
					: order.coin;
				return coin === activeToken;
			});

			manager.syncPositions(chart, tokenPositions);
			manager.syncOrders(chart, tokenOrders);

			prevPosKeyRef.current = newPosKey;
			prevOrdKeyRef.current = newOrdKey;
		}, SYNC_DEBOUNCE_MS);

		return () => {
			if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
		};
	}, [isReady, activeToken, positions, orders, widgetRef]);

	// Clear lines on token change
	const prevTokenRef = useRef(activeToken);
	useEffect(() => {
		if (prevTokenRef.current !== activeToken) {
			if (widgetRef.current && managerRef.current && isReady) {
				try {
					const chart = widgetRef.current.activeChart();
					managerRef.current.clearAll(chart);
				} catch {
					// Widget may not be ready
				}
			}
			prevPosKeyRef.current = '';
			prevOrdKeyRef.current = '';
			prevTokenRef.current = activeToken;
		}
	}, [activeToken, isReady, widgetRef]);

	// Clear all lines on unmount
	useEffect(() => {
		return () => {
			if (widgetRef.current && managerRef.current) {
				try {
					const chart = widgetRef.current.activeChart();
					managerRef.current.clearAll(chart);
				} catch {
					// Widget may already be disposed
				}
			}
		};
	}, [widgetRef]);
}
