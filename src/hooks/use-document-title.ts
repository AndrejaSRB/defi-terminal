import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';
import { pricesAtom } from '@/atoms/prices';
import { activeNormalizerAtom } from '@/atoms/dex';
import { formatTokenName } from '@/lib/token';

export function useDocumentTitle() {
	const token = useAtomValue(activeTokenAtom);
	const prices = useAtomValue(pricesAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);

	useEffect(() => {
		const mid = prices[token];
		const name = formatTokenName(token);

		if (mid) {
			const price = normalizer.formatPrice(parseFloat(mid), token);
			document.title = `${price} | ${name} | Terminal`;
		} else {
			document.title = `${name} | Terminal`;
		}
	}, [token, prices, normalizer]);
}
