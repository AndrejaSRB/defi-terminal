import { useCallback } from 'react';
import { useAtomValue, useStore } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeNormalizerAtom } from '@/atoms/dex';
import { assetMetaAtom } from '@/atoms/asset-meta';
import { pricesAtom } from '@/atoms/prices';

export function useChartData() {
	const token = useAtomValue(activeTokenAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);
	const assetMeta = useAtomValue(assetMetaAtom);
	const store = useStore();

	const getPrice = useCallback(
		(coin: string) => {
			const prices = store.get(pricesAtom);
			return parseFloat(prices[coin] ?? '0');
		},
		[store],
	);

	return {
		token,
		normalizer,
		assetMetaReady: assetMeta.size > 0,
		getPrice,
	};
}
