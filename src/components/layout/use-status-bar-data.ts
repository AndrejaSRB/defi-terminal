import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { connectionStateAtom } from '@/atoms/connection';
import { activeNormalizerAtom } from '@/atoms/dex';
import { userPositionsAtom } from '@/atoms/user/positions';
import { userOpenOrdersAtom } from '@/atoms/user/orders';
import { pricesAtom } from '@/atoms/prices';
import { safeParseFloat } from '@/lib/numbers';

export function useStatusBarData() {
	const connectionState = useAtomValue(connectionStateAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);
	const positions = useAtomValue(userPositionsAtom);
	const orders = useAtomValue(userOpenOrdersAtom);
	const prices = useAtomValue(pricesAtom);

	return useMemo(() => {
		const statusMap = {
			connected: 'online',
			connecting: 'connecting',
			reconnecting: 'connecting',
			disconnected: 'offline',
		} as const;

		let totalOpen = 0;
		let totalLongs = 0;
		let totalShorts = 0;
		let totalPnl = 0;

		for (const pos of positions) {
			const size = safeParseFloat(pos.size);
			const entry = safeParseFloat(pos.entryPrice);
			const mark = safeParseFloat(prices[pos.coin], entry);
			const value = mark * size;
			const direction = pos.side === 'LONG' ? 1 : -1;
			const pnl = (mark - entry) * size * direction;

			totalOpen += value;
			totalPnl += pnl;
			if (pos.side === 'LONG') totalLongs += value;
			else totalShorts += value;
		}

		const fmt = (v: number) =>
			`$${Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

		return {
			connectionStatus: statusMap[connectionState],
			dexName: normalizer.name,
			totalOpen: fmt(totalOpen),
			totalLongs: fmt(totalLongs),
			totalShorts: fmt(totalShorts),
			totalPnl: `${totalPnl >= 0 ? '+' : '-'}${fmt(totalPnl)}`,
			totalPnlValue: totalPnl,
			orderCount: orders.length,
		};
	}, [connectionState, normalizer, positions, orders, prices]);
}
