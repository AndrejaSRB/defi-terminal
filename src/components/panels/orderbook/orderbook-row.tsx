import { memo, useCallback } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { cn } from '@/lib/utils';
import {
	orderTypeAtom,
	limitPriceAtom,
} from '@/components/panels/order-form/atoms/order-form-atoms';
import { activeNormalizerAtom } from '@/atoms/dex';
import { activeTokenAtom } from '@/atoms/active-token';
import type { FormattedLevel } from './hooks/use-orderbook-data';

const ASK_COLOR = 'rgba(235, 54, 90, 0.15)';
const BID_COLOR = 'rgba(2, 199, 123, 0.15)';

export const OrderBookRow = memo(function OrderBookRow({
	level,
}: {
	level: FormattedLevel;
}) {
	const setOrderType = useSetAtom(orderTypeAtom);
	const setLimitPrice = useSetAtom(limitPriceAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);
	const token = useAtomValue(activeTokenAtom);

	const handleClick = useCallback(() => {
		setOrderType('limit');
		const decimals = normalizer.calculatePriceDecimals(level.rawPrice, token);
		setLimitPrice(level.rawPrice.toFixed(decimals));
	}, [level.rawPrice, setOrderType, setLimitPrice, normalizer, token]);

	const isAsk = level.side === 'ask';

	return (
		<div
			data-ob-row
			onClick={handleClick}
			className="relative grid min-h-[22px] flex-1 cursor-pointer grid-cols-3 items-center text-xs hover:bg-muted/30"
		>
			<div
				className="absolute inset-y-0 left-0 transition-[width] duration-50 ease-out"
				style={{
					width: `${level.depthPercent}%`,
					backgroundColor: isAsk ? ASK_COLOR : BID_COLOR,
				}}
			/>
			<span
				className={cn(
					'relative z-10 px-2 py-0.5',
					isAsk ? 'text-red-400' : 'text-green-400',
				)}
			>
				{level.price}
			</span>
			<span className="relative z-10 px-2 py-0.5 text-center">
				{level.size}
			</span>
			<span className="relative z-10 px-2 py-0.5 text-right">
				{level.total}
			</span>
		</div>
	);
});
