import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeAggregationAtom } from '@/atoms/market-data/aggregation';
import { orderBookByTokenAtom } from '@/atoms/market-data/orderbook';

export function useDexOrderbook() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const token = useAtomValue(activeTokenAtom);
	const agg = useAtomValue(activeAggregationAtom);
	const setOrderBook = useSetAtom(orderBookByTokenAtom(token));

	useEffect(() => {
		setOrderBook((prev) => ({
			...prev,
			status: prev.status === 'idle' ? 'loading' : prev.status,
		}));

		const channel = normalizer.channels.orderBook(token, agg ?? undefined);
		const unsub = tradingWs.subscribe(channel, (raw) => {
			const book = normalizer.parseOrderBook(raw);
			setOrderBook({ status: 'live', data: book, error: null });
		});

		return unsub;
	}, [normalizer, token, agg, setOrderBook]);
}
