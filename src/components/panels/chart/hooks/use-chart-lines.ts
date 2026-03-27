import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';
import { userPositionsAtom } from '@/atoms/user/positions';
import { userOpenOrdersAtom } from '@/atoms/user/orders';
import { ChartLineManager } from '../utils/chart-lines';
import type { IChartingLibraryWidget } from '@charting_library/charting_library';

export function useChartLines(
	widgetRef: React.RefObject<IChartingLibraryWidget | null>,
	isReady: boolean,
): void {
	const managerRef = useRef<ChartLineManager | null>(null);
	const activeToken = useAtomValue(activeTokenAtom);
	const positions = useAtomValue(userPositionsAtom);
	const orders = useAtomValue(userOpenOrdersAtom);

	// Initialize manager
	if (!managerRef.current) {
		managerRef.current = new ChartLineManager();
	}

	// Sync lines when data or token changes
	useEffect(() => {
		if (!isReady || !widgetRef.current || !managerRef.current) return;

		const chart = widgetRef.current.activeChart();
		const manager = managerRef.current;

		// Filter positions and orders for the active token
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
	}, [isReady, activeToken, positions, orders, widgetRef]);

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

	// Clear lines on token change (before new ones are drawn)
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
			prevTokenRef.current = activeToken;
		}
	}, [activeToken, isReady, widgetRef]);
}
