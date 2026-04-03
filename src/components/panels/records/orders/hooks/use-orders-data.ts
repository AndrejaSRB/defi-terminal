import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { userOpenOrdersAtom } from '@/atoms/user/orders';
import { activeNormalizerAtom } from '@/atoms/dex';
import { parseTokenName } from '@/lib/token';

const ORDER_TYPE_LABELS: Record<string, string> = {
	limit: 'Limit',
	market: 'Market',
	tp: 'Take Profit Limit',
	sl: 'Stop Limit',
	tp_market: 'Take Profit Market',
	sl_market: 'Stop Market',
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
	return `${date} - ${time}`;
}

function getDirection(
	side: 'buy' | 'sell',
	isReduceOnly: boolean,
	isPositionTpsl: boolean,
): string {
	if (isPositionTpsl) {
		return side === 'sell' ? 'Close Long' : 'Close Short';
	}
	if (isReduceOnly) {
		return side === 'sell' ? 'Close Long' : 'Close Short';
	}
	return side === 'buy' ? 'Long' : 'Short';
}

export interface FormattedOrder {
	id: string;
	coin: string;
	displayName: string;
	dexName: string | null;
	time: string;
	type: string;
	direction: string;
	side: 'buy' | 'sell';
	size: string;
	originalSize: string;
	orderValue: string;
	price: string;
	reduceOnly: string;
	triggerCondition: string;
	tpsl: string;
	isLimitOrder: boolean;
	isPositionTpsl: boolean;
	rawOrderId: number;
	rawExternalId: string | null;
	rawPrice: number;
	rawSize: number;
	rawOrigSize: number;
}

export function useOrdersData() {
	const orders = useAtomValue(userOpenOrdersAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);

	const formatted = useMemo(() => {
		const noDollar = { hasDollarSign: false };

		return orders.map((order): FormattedOrder => {
			const { formattedTokenName, dexName } = parseTokenName(order.coin);
			const isMarketType =
				order.orderType === 'market' ||
				order.orderType === 'tp_market' ||
				order.orderType === 'sl_market';
			const isLimit = order.orderType === 'limit';
			const direction = getDirection(
				order.side,
				order.isReduceOnly,
				order.isPositionTpsl,
			);

			// Size display: "Close Position" for position TP/SL, formatted for others
			const sizeDisplay = order.isPositionTpsl
				? 'Close Position'
				: normalizer.formatSize(order.size, order.coin);

			// Original size: "--" for position TP/SL
			const origSizeDisplay = order.isPositionTpsl
				? '--'
				: normalizer.formatSize(order.origSize, order.coin);

			// Order value: price * origSize for limit, "--" for market/trigger
			const orderValue =
				!isMarketType && order.price > 0 && order.origSize > 0
					? `${(order.price * order.origSize).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
					: '--';

			// Price: "Market" for market/trigger orders
			const priceDisplay = isMarketType
				? 'Market'
				: normalizer.formatPrice(order.price, order.coin);

			// Trigger condition
			let triggerCondition = 'N/A';
			if (order.triggerCondition && order.triggerPrice) {
				const formattedTrigger = normalizer.formatPrice(
					order.triggerPrice,
					order.coin,
					noDollar,
				);
				triggerCondition =
					order.triggerCondition === 'gt'
						? `Price above ${formattedTrigger}`
						: `Price below ${formattedTrigger}`;
			}

			// TP/SL
			const tp = order.tp
				? normalizer.formatPrice(order.tp, order.coin, noDollar)
				: '--';
			const sl = order.sl
				? normalizer.formatPrice(order.sl, order.coin, noDollar)
				: '--';

			return {
				id: order.id,
				coin: order.coin,
				displayName: formattedTokenName,
				dexName,
				time: formatTime(order.timestamp),
				type: ORDER_TYPE_LABELS[order.orderType] ?? order.orderType,
				direction,
				side: order.side,
				size: sizeDisplay,
				originalSize: origSizeDisplay,
				orderValue,
				price: priceDisplay,
				reduceOnly: order.isReduceOnly ? 'Yes' : 'No',
				triggerCondition,
				tpsl: `${tp} / ${sl}`,
				isLimitOrder: isLimit,
				isPositionTpsl: order.isPositionTpsl,
				rawOrderId: Number(order.id),
				rawExternalId: order.cloid,
				rawPrice: order.price,
				rawSize: order.size,
				rawOrigSize: order.origSize,
			};
		});
	}, [orders, normalizer]);

	return { orders: formatted, isEmpty: formatted.length === 0 };
}
