import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { pricesAtom } from '@/atoms/prices';

export function useDexPrices() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const setPrices = useSetAtom(pricesAtom);

	useEffect(() => {
		const channel = normalizer.channels.prices();
		const unsub = tradingWs.subscribe(channel, (raw) => {
			const prices = normalizer.parsePrices(raw);
			console.log(
				'[DexPrices] Received prices update:',
				Object.keys(prices).length,
				'coins',
			);
			setPrices(prices);
		});
		return unsub;
	}, [normalizer, setPrices]);
}
