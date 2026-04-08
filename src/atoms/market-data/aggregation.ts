import { atom } from 'jotai';
import { activeNormalizerAtom } from '@/atoms/dex';
import { activeTokenPriceAtom } from '@/atoms/prices';
import { allAssetCtxsAtom } from '@/atoms/all-asset-ctxs';
import { activeTokenAtom } from '@/atoms/active-token';
import type { AggregationLevel } from '@/normalizer/types';

/** User's explicit aggregation pick. Null means "use default (finest) for current token". */
export const userAggregationAtom = atom<AggregationLevel | null>(null);

/** Derived: effective aggregation level resolved against available levels for active token. */
export const activeAggregationAtom = atom<AggregationLevel | null>((get) => {
	const normalizer = get(activeNormalizerAtom);
	const token = get(activeTokenAtom);
	const tokenPrice = get(activeTokenPriceAtom);
	const assetCtxs = get(allAssetCtxsAtom);
	const userChoice = get(userAggregationAtom);

	const wsPrice = tokenPrice ? parseFloat(tokenPrice) : 0;
	const ctxPrice = assetCtxs.get(token)?.markPrice;
	const midPrice = wsPrice || (ctxPrice ? parseFloat(ctxPrice) : 0);

	const levels = normalizer.getAggregationLevels(midPrice);

	if (
		userChoice &&
		levels.some(
			(level) =>
				level.nSigFigs === userChoice.nSigFigs &&
				level.mantissa === userChoice.mantissa,
		)
	) {
		return userChoice;
	}
	return levels[0] ?? null;
});
