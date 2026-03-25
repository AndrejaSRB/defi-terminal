import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { userOpenOrdersAtom } from '@/atoms/user/orders';
import { activeNormalizerAtom } from '@/atoms/dex';
import { parseTokenName } from '@/lib/token';

const ORDER_TYPE_LABELS: Record<string, string> = {
	limit: 'Limit',
	market: 'Market',
	tp: 'TP Limit',
	sl: 'SL Limit',
	tp_market: 'TP Market',
	sl_market: 'SL Market',
};

function formatTime(ts: number): string {
	const d = new Date(ts);
	return d.toLocaleTimeString('en-US', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
}

export interface FormattedOrder {
	id: string;
	coin: string;
	displayName: string;
	dexName: string | null;
	side: 'buy' | 'sell';
	orderType: string;
	price: string;
	size: string;
	filled: string;
	triggerPrice: string | null;
	tp: string | null;
	sl: string | null;
	isReduceOnly: boolean;
	timestamp: string;
}

export function useOrdersData() {
	const orders = useAtomValue(userOpenOrdersAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);

	const formatted = useMemo(() => {
		return orders.map((o): FormattedOrder => {
			const { formattedTokenName, dexName } = parseTokenName(o.coin);

			return {
				id: o.id,
				coin: o.coin,
				displayName: formattedTokenName,
				dexName,
				side: o.side,
				orderType: ORDER_TYPE_LABELS[o.orderType] ?? o.orderType,
				price: normalizer.formatPrice(o.price, o.coin),
				size: normalizer.formatSize(o.size, o.coin),
				filled: `${normalizer.formatSize(o.filledSize, o.coin)} / ${normalizer.formatSize(o.origSize, o.coin)}`,
				triggerPrice: o.triggerPrice
					? normalizer.formatPrice(o.triggerPrice, o.coin)
					: null,
				tp: o.tp
					? normalizer.formatPrice(o.tp, o.coin, {
							hasDollarSign: false,
						})
					: null,
				sl: o.sl
					? normalizer.formatPrice(o.sl, o.coin, {
							hasDollarSign: false,
						})
					: null,
				isReduceOnly: o.isReduceOnly,
				timestamp: formatTime(o.timestamp),
			};
		});
	}, [orders, normalizer]);

	return { orders: formatted, isEmpty: formatted.length === 0 };
}
