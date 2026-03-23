import { useCallback, useState } from 'react';

export type OrderBookView = 'both' | 'asks' | 'bids';

export function useOrderbookView() {
	const [view, setView] = useState<OrderBookView>('both');
	const set = useCallback((v: OrderBookView) => setView(v), []);
	return { view, setView: set };
}
