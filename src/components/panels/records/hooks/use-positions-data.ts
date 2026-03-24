import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { userPositionsAtom } from '@/atoms/user/positions';
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
}

export function usePositionsData() {
	const positions = useAtomValue(userPositionsAtom);
	const prices = useAtomValue(pricesAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);

	const formatted = useMemo(() => {
		return positions.map((pos): FormattedPosition => {
			const { formattedTokenName, dexName } = parseTokenName(pos.coin);
			const size = safeParseFloat(pos.size);
			const entry = safeParseFloat(pos.entryPrice);
			const mark = safeParseFloat(prices[pos.coin], entry);
			const margin = safeParseFloat(pos.marginUsed);
			const funding = safeParseFloat(pos.funding);

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
				pnl: `${pnlValue >= 0 ? '+' : ''}$${Math.abs(pnlValue).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
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
				tp: pos.tp ? normalizer.formatPrice(pos.tp, pos.coin, noDollar) : null,
				sl: pos.sl ? normalizer.formatPrice(pos.sl, pos.coin, noDollar) : null,
			};
		});
	}, [positions, prices, normalizer]);

	return { positions: formatted, isEmpty: formatted.length === 0 };
}
