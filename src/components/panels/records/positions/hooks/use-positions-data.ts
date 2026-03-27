import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { userPositionsAtom } from '@/atoms/user/positions';
import { userOpenOrdersAtom } from '@/atoms/user/orders';
import { pricesAtom } from '@/atoms/prices';
import { activeNormalizerAtom } from '@/atoms/dex';
import { parseTokenName } from '@/lib/token';
import { safeParseFloat } from '@/lib/numbers';

export interface FormattedPosition {
	coin: string;
	displayName: string;
	dexName: string | null;
	side: 'LONG' | 'SHORT';
	leverage: string;
	size: string;
	positionValue: string;
	entryPrice: string;
	markPrice: string;
	pnl: string;
	pnlValue: number;
	roi: string;
	liquidationPrice: string;
	marginUsed: string;
	funding: string;
	tp: string | null;
	sl: string | null;
	tpOrderId: number | null;
	slOrderId: number | null;
	rawSize: number;
	rawEntryPrice: number;
	rawMarkPrice: number;
	rawTpPrice: number | null;
	rawSlPrice: number | null;
}

interface TpslEntry {
	tp: number | null;
	tpOrderId: number | null;
	sl: number | null;
	slOrderId: number | null;
}

export function usePositionsData() {
	const positions = useAtomValue(userPositionsAtom);
	const openOrders = useAtomValue(userOpenOrdersAtom);
	const prices = useAtomValue(pricesAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);

	const formatted = useMemo(() => {
		// Build TP/SL map with order IDs for cancel support
		const tpslMap = new Map<string, TpslEntry>();
		for (const order of openOrders) {
			if (order.orderType === 'tp_market' || order.orderType === 'tp') {
				const entry = tpslMap.get(order.coin) ?? {
					tp: null,
					tpOrderId: null,
					sl: null,
					slOrderId: null,
				};
				entry.tp = order.triggerPrice;
				entry.tpOrderId = Number(order.id);
				tpslMap.set(order.coin, entry);
			}
			if (order.orderType === 'sl_market' || order.orderType === 'sl') {
				const entry = tpslMap.get(order.coin) ?? {
					tp: null,
					tpOrderId: null,
					sl: null,
					slOrderId: null,
				};
				entry.sl = order.triggerPrice;
				entry.slOrderId = Number(order.id);
				tpslMap.set(order.coin, entry);
			}
		}

		return positions.map((pos): FormattedPosition => {
			const { formattedTokenName, dexName } = parseTokenName(pos.coin);
			const size = safeParseFloat(pos.size);
			const entry = safeParseFloat(pos.entryPrice);
			const mark = safeParseFloat(prices[pos.coin], entry);
			const margin = safeParseFloat(pos.marginUsed);
			const funding = safeParseFloat(pos.funding);
			const tpsl = tpslMap.get(pos.coin);

			const direction = pos.side === 'LONG' ? 1 : -1;
			const pnlValue = (mark - entry) * size * direction;
			const posValue = mark * size;
			const roiValue = margin > 0 ? (pnlValue / margin) * 100 : 0;

			const noDollar = { hasDollarSign: false };

			return {
				coin: pos.coin,
				displayName: formattedTokenName,
				dexName,
				side: pos.side,
				leverage: `${pos.leverage}x`,
				size: normalizer.formatSize(size, pos.coin),
				positionValue: `$${posValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
				entryPrice: normalizer.formatPrice(entry, pos.coin),
				markPrice: normalizer.formatPrice(mark, pos.coin),
				pnl: `${pnlValue >= 0 ? '+' : ''}$${Math.abs(pnlValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
				pnlValue,
				roi: `${roiValue >= 0 ? '+' : ''}${roiValue.toFixed(2)}%`,
				liquidationPrice: pos.liquidationPrice
					? normalizer.formatPrice(
							safeParseFloat(pos.liquidationPrice),
							pos.coin,
						)
					: '--',
				marginUsed: `$${margin.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
				funding: `$${Math.abs(funding).toLocaleString('en-US', { maximumFractionDigits: 4 })}`,
				tp: tpsl?.tp
					? normalizer.formatPrice(tpsl.tp, pos.coin, noDollar)
					: null,
				sl: tpsl?.sl
					? normalizer.formatPrice(tpsl.sl, pos.coin, noDollar)
					: null,
				tpOrderId: tpsl?.tpOrderId ?? null,
				slOrderId: tpsl?.slOrderId ?? null,
				rawSize: size,
				rawEntryPrice: entry,
				rawMarkPrice: mark,
				rawTpPrice: tpsl?.tp ?? null,
				rawSlPrice: tpsl?.sl ?? null,
			};
		});
	}, [positions, openOrders, prices, normalizer]);

	return { positions: formatted, isEmpty: formatted.length === 0 };
}
