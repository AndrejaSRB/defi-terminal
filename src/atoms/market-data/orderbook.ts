import { atom } from 'jotai';
import type { OrderBook } from '@/normalizer/types';
import type { MarketDataState } from './state';

const EMPTY: OrderBook = { bids: [], asks: [], timestamp: 0 };

const orderBookAtoms = new Map<
	string,
	ReturnType<typeof atom<MarketDataState<OrderBook>>>
>();

export function orderBookByTokenAtom(token: string) {
	if (!orderBookAtoms.has(token)) {
		orderBookAtoms.set(
			token,
			atom<MarketDataState<OrderBook>>({
				status: 'idle',
				data: EMPTY,
				error: null,
			}),
		);
	}
	return orderBookAtoms.get(token)!;
}

export { EMPTY as EMPTY_ORDER_BOOK };
