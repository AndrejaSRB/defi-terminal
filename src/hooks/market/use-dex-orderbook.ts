import { useEffect, useRef, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeAggregationAtom } from '@/atoms/market-data/aggregation';
import { orderBookByTokenAtom } from '@/atoms/market-data/orderbook';
import type { OrderBook } from '@/normalizer/types';

/**
 * rAF-batched orderbook hook.
 * WS can fire many updates per second — we buffer the latest
 * and flush to the atom once per animation frame (~60fps max).
 * This prevents React from re-rendering the orderbook on every
 * WS tick while keeping the display visually smooth.
 */
export function useDexOrderbook() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const token = useAtomValue(activeTokenAtom);
	const agg = useAtomValue(activeAggregationAtom);
	const setOrderBook = useSetAtom(orderBookByTokenAtom(token));

	const pendingRef = useRef<OrderBook | null>(null);
	const rafRef = useRef<number>(0);

	const flush = useCallback(() => {
		rafRef.current = 0;
		const book = pendingRef.current;
		if (book) {
			pendingRef.current = null;
			setOrderBook({ status: 'live', data: book, error: null });
		}
	}, [setOrderBook]);

	useEffect(() => {
		setOrderBook((prev) => ({
			...prev,
			status: prev.status === 'idle' ? 'loading' : prev.status,
		}));

		const channel = normalizer.channels.orderBook(token, agg ?? undefined);
		const unsub = tradingWs.subscribe(channel, (raw) => {
			pendingRef.current = normalizer.parseOrderBook(raw);

			if (!rafRef.current) {
				rafRef.current = requestAnimationFrame(flush);
			}
		});

		return () => {
			unsub();
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = 0;
			}
			pendingRef.current = null;
		};
	}, [normalizer, token, agg, setOrderBook, flush]);
}
