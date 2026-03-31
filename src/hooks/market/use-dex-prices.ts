import { useEffect, useRef, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { pricesAtom } from '@/atoms/prices';

/**
 * rAF-batched prices hook.
 *
 * Extended's global mark-prices stream fires one message per market
 * (hundreds of markets). Without batching, each tick creates a new
 * prices object and triggers re-renders for all consumers.
 * Batching accumulates updates and flushes once per animation frame.
 */
export function useDexPrices() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const setPrices = useSetAtom(pricesAtom);
	const pendingRef = useRef<Record<string, string>>({});
	const rafRef = useRef(0);

	const flush = useCallback(() => {
		rafRef.current = 0;
		const batch = pendingRef.current;
		if (Object.keys(batch).length > 0) {
			setPrices((prev) => ({ ...prev, ...batch }));
			pendingRef.current = {};
		}
	}, [setPrices]);

	useEffect(() => {
		const channel = normalizer.channels.prices();
		const unsub = tradingWs.subscribe(channel, (raw) => {
			const update = normalizer.parsePrices(raw);
			Object.assign(pendingRef.current, update);

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
			pendingRef.current = {};
		};
	}, [normalizer, flush]);
}
