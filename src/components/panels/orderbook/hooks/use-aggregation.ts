import { useCallback, useEffect, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { activeNormalizerAtom } from '@/atoms/dex';
import { activeTokenAtom } from '@/atoms/active-token';
import { pricesAtom } from '@/atoms/prices';
import { allAssetCtxsAtom } from '@/atoms/all-asset-ctxs';
import { activeAggregationAtom } from '@/atoms/market-data/aggregation';
import type { AggregationLevel } from '@/normalizer/types';

export function useAggregation() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const token = useAtomValue(activeTokenAtom);
	const prices = useAtomValue(pricesAtom);
	const assetCtxs = useAtomValue(allAssetCtxsAtom);
	const active = useAtomValue(activeAggregationAtom);
	const setActive = useSetAtom(activeAggregationAtom);

	// Use WS price first, fall back to REST asset context mark price
	const wsPrice = prices[token] ? parseFloat(prices[token]) : 0;
	const ctxPrice = assetCtxs.get(token)?.markPrice;
	const midPrice = wsPrice || (ctxPrice ? parseFloat(ctxPrice) : 0);

	const levels = useMemo(
		() => normalizer.getAggregationLevels(midPrice),
		[normalizer, midPrice],
	);

	// Auto-select first level when none is active and levels are available
	useEffect(() => {
		if (!active && levels.length > 0) {
			setActive(levels[0]);
		}
	}, [active, levels, setActive]);

	const setLevel = useCallback(
		(level: AggregationLevel | null) => setActive(level),
		[setActive],
	);

	return { levels, active, setLevel };
}
