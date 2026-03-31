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
 *
 * Two modes depending on the normalizer:
 * - **Snapshot mode** (HL): each WS message is a full book
 * - **Accumulator mode** (Extended): REST snapshot + WS deltas merged
 *   via OrderBookAccumulator with buffering to prevent race conditions
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

	const scheduleFlush = useCallback(
		(book: OrderBook) => {
			pendingRef.current = book;
			if (!rafRef.current) {
				rafRef.current = requestAnimationFrame(flush);
			}
		},
		[flush],
	);

	useEffect(() => {
		let cancelled = false;

		setOrderBook((prev) => ({
			...prev,
			status: prev.status === 'idle' ? 'loading' : prev.status,
		}));

		const channel = normalizer.channels.orderBook(token, agg ?? undefined);

		if (normalizer.createOrderBookAccumulator && normalizer.feedOrderBook) {
			// ── Accumulator mode: REST snapshot + WS deltas ──
			const accumulator = normalizer.createOrderBookAccumulator();
			const feed = normalizer.feedOrderBook;

			// Subscribe WS immediately — messages buffer until seeded
			const unsub = tradingWs.subscribe(channel, (raw) => {
				if (accumulator.bufferIfNeeded(raw)) return;
				feed(raw, accumulator);
				scheduleFlush(accumulator.getBook());
			});

			// Fetch REST snapshot, then seed accumulator (replays buffered deltas)
			normalizer
				.fetchOrderBook(token, agg ?? undefined)
				.then((snapshot) => {
					if (cancelled) return;
					accumulator.seed(snapshot, feed);
					scheduleFlush(accumulator.getBook());
				})
				.catch((error) => {
					if (cancelled) return;
					console.error('[Orderbook] REST snapshot failed:', error);
					// Seed with empty book so WS SNAPSHOT can take over
					const empty = { bids: [], asks: [], timestamp: 0 };
					accumulator.seed(empty, feed);
				});

			return () => {
				cancelled = true;
				unsub();
				if (rafRef.current) {
					cancelAnimationFrame(rafRef.current);
					rafRef.current = 0;
				}
				pendingRef.current = null;
			};
		}

		// ── Snapshot mode: each WS message is a full book ──
		const unsub = tradingWs.subscribe(channel, (raw) => {
			scheduleFlush(normalizer.parseOrderBook(raw));
		});

		return () => {
			cancelled = true;
			unsub();
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = 0;
			}
			pendingRef.current = null;
		};
	}, [normalizer, token, agg, setOrderBook, scheduleFlush]);
}
