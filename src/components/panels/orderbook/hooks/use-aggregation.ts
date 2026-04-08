import { useCallback, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { activeNormalizerAtom } from '@/atoms/dex';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeTokenPriceAtom } from '@/atoms/prices';
import { allAssetCtxsAtom } from '@/atoms/all-asset-ctxs';
import {
	userAggregationAtom,
	activeAggregationAtom,
} from '@/atoms/market-data/aggregation';
import type { AggregationLevel } from '@/normalizer/types';

export function useAggregation() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const token = useAtomValue(activeTokenAtom);
	const tokenPrice = useAtomValue(activeTokenPriceAtom);
	const assetCtxs = useAtomValue(allAssetCtxsAtom);
	const active = useAtomValue(activeAggregationAtom);
	const setUserChoice = useSetAtom(userAggregationAtom);

	const wsPrice = tokenPrice ? parseFloat(tokenPrice) : 0;
	const ctxPrice = assetCtxs.get(token)?.markPrice;
	const midPrice = wsPrice || (ctxPrice ? parseFloat(ctxPrice) : 0);

	const levels = useMemo(
		() => normalizer.getAggregationLevels(midPrice),
		[normalizer, midPrice],
	);

	const setLevel = useCallback(
		(level: AggregationLevel | null) => setUserChoice(level),
		[setUserChoice],
	);

	return { levels, active, setLevel };
}
