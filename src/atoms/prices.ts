import { atom } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';
import type { Prices } from '@/normalizer/types';

export const pricesAtom = atom<Prices>({});

/** Price for the active token only. Avoids recomputation when other tokens update. */
export const activeTokenPriceAtom = atom<string | null>((get) => {
	const token = get(activeTokenAtom);
	const prices = get(pricesAtom);
	return prices[token] ?? null;
});
