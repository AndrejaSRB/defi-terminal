import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeNormalizerAtom } from '@/atoms/dex';
import { tradesByTokenAtom } from '@/atoms/market-data/trades';

export interface FormattedTrade {
	id: string;
	price: string;
	size: string;
	time: string;
	side: 'buy' | 'sell';
}

function formatTime(ts: number): string {
	const d = new Date(ts);
	return d.toLocaleTimeString('en-US', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
}

export function useTradesData() {
	const token = useAtomValue(activeTokenAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);
	const { status, data: trades } = useAtomValue(tradesByTokenAtom(token));

	return useMemo(() => {
		const formatted: FormattedTrade[] = trades.map((t) => ({
			id: t.id,
			price: normalizer.formatPrice(t.price, token, {
				hasDollarSign: false,
			}),
			size: normalizer.formatSize(t.size, token),
			time: formatTime(t.timestamp),
			side: t.side,
		}));

		return {
			trades: formatted,
			isLoading: status !== 'live',
		};
	}, [trades, token, normalizer, status]);
}
