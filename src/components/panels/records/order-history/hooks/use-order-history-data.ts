import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { userOrderHistoryAtom } from '@/atoms/user/order-history';
import { activeNormalizerAtom } from '@/atoms/dex';
import { parseTokenName } from '@/lib/token';

export interface FormattedHistoricalOrder {
	id: string;
	coin: string;
	displayName: string;
	dexName: string | null;
	orderType: string;
	dir: string;
	side: 'buy' | 'sell';
	price: string;
	size: string;
	filledSize: string;
	orderValue: string;
	reduceOnly: boolean;
	triggerCondition: string | null;
	tp: string | null;
	sl: string | null;
	status: string;
	time: string;
}

const STATUS_LABELS: Record<string, string> = {
	filled: 'Filled',
	open: 'Open',
	canceled: 'Canceled',
	triggered: 'Triggered',
	rejected: 'Rejected',
	marginCanceled: 'Margin Canceled',
	reduceOnlyCanceled: 'Reduce Only Canceled',
};

function formatTime(ts: number): string {
	const d = new Date(ts);
	const date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
	const time = d.toLocaleTimeString('en-US', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
	return `${date} ${time}`;
}

export function useOrderHistoryData() {
	const orders = useAtomValue(userOrderHistoryAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);

	const formatted = useMemo(() => {
		return orders.map((o): FormattedHistoricalOrder => {
			const { formattedTokenName, dexName } = parseTokenName(o.coin);
			const orderValue = o.price * o.origSize;

			return {
				id: o.id,
				coin: o.coin,
				displayName: formattedTokenName,
				dexName,
				orderType: o.orderType,
				dir: o.dir,
				side: o.side,
				price: normalizer.formatPrice(o.price, o.coin),
				size: `${normalizer.formatSize(o.origSize, o.coin)} ${formattedTokenName}`,
				filledSize: `${normalizer.formatSize(o.filledSize, o.coin)} ${formattedTokenName}`,
				orderValue: `$${orderValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
				reduceOnly: o.reduceOnly,
				triggerCondition: o.triggerCondition,
				tp: o.tp != null ? normalizer.formatPrice(o.tp, o.coin) : null,
				sl: o.sl != null ? normalizer.formatPrice(o.sl, o.coin) : null,
				status: STATUS_LABELS[o.status] ?? o.status,
				time: formatTime(o.statusTimestamp),
			};
		});
	}, [orders, normalizer]);

	return { orders: formatted, isEmpty: formatted.length === 0 };
}
