import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { activeTokenAtom } from '@/atoms/active-token';
import { tradesByTokenAtom } from '@/atoms/market-data/trades';

const MAX_TRADES = 100;

export function useDexTrades() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const token = useAtomValue(activeTokenAtom);
	const setTrades = useSetAtom(tradesByTokenAtom(token));

	useEffect(() => {
		setTrades((prev) => ({
			...prev,
			status: prev.status === 'idle' ? 'loading' : prev.status,
		}));

		const channel = normalizer.channels.trades(token);
		const unsub = tradingWs.subscribe(channel, (raw) => {
			const newTrades = normalizer.parseTrades(raw);
			setTrades((prev) => {
				const existingIds = new Set(prev.data.map((trade) => trade.id));
				const unique = newTrades.filter((trade) => !existingIds.has(trade.id));
				return {
					status: 'live',
					data: [...unique, ...prev.data].slice(0, MAX_TRADES),
					error: null,
				};
			});
		});

		return unsub;
	}, [normalizer, token, setTrades]);
}
