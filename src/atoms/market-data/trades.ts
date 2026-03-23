import { atom } from 'jotai';
import type { Trade } from '@/normalizer/types';
import type { MarketDataState } from './state';

const EMPTY: Trade[] = [];

const tradesAtoms = new Map<
	string,
	ReturnType<typeof atom<MarketDataState<Trade[]>>>
>();

export function tradesByTokenAtom(token: string) {
	if (!tradesAtoms.has(token)) {
		tradesAtoms.set(
			token,
			atom<MarketDataState<Trade[]>>({
				status: 'idle',
				data: EMPTY,
				error: null,
			}),
		);
	}
	return tradesAtoms.get(token)!;
}

export { EMPTY as EMPTY_TRADES };
