import { useCallback } from 'react';
import { useAtomValue, useStore } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeNormalizerAtom } from '@/atoms/dex';
import { assetMetaAtom } from '@/atoms/asset-meta';
import { pricesAtom } from '@/atoms/prices';
import { allAssetCtxsAtom } from '@/atoms/all-asset-ctxs';

export function useChartData() {
	const token = useAtomValue(activeTokenAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);
	const assetMeta = useAtomValue(assetMetaAtom);
	const store = useStore();

	// Stable reference — store.get always reads latest values
	// Falls back to allAssetCtxs mark price when WS price not yet available
	const getPrice = useCallback(
		(coin: string) => {
			const currentPrices = store.get(pricesAtom);
			const wsPrice = parseFloat(currentPrices[coin] ?? '0');
			if (wsPrice > 0) return wsPrice;

			const ctx = store.get(allAssetCtxsAtom).get(coin);
			return ctx ? parseFloat(ctx.markPrice) : 0;
		},
		// biome-ignore lint: store is stable across renders, empty deps intentional
		[],
	);

	const prices = useAtomValue(pricesAtom);
	const hasPrices = Object.keys(prices).length > 0;

	return {
		token,
		normalizer,
		assetMetaReady: assetMeta.size > 0 && hasPrices,
		getPrice,
	};
}
