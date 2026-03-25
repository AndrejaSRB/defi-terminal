import { memo, useCallback, useRef, useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { cn } from '@/lib/utils';
import {
	orderTypeAtom,
	limitPriceAtom,
} from '@/components/panels/order-form/atoms/order-form-atoms';
import type { FormattedLevel } from './hooks/use-orderbook-data';

const ASK_COLOR = 'rgba(235, 54, 90, 0.15)';
const BID_COLOR = 'rgba(2, 199, 123, 0.15)';

export const OrderBookRow = memo(function OrderBookRow({
	level,
	isNew,
}: {
	level: FormattedLevel;
	isNew?: boolean;
}) {
	const setOrderType = useSetAtom(orderTypeAtom);
	const setLimitPrice = useSetAtom(limitPriceAtom);
	const rowRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isNew) return;
		const el = rowRef.current;
		if (!el) return;
		el.classList.add('ob-flash');
		const timer = setTimeout(() => el.classList.remove('ob-flash'), 250);
		return () => clearTimeout(timer);
	}, [isNew]);

	const handleClick = useCallback(() => {
		setOrderType('limit');
		setLimitPrice(level.rawPrice.toString());
	}, [level.rawPrice, setOrderType, setLimitPrice]);

	const isAsk = level.side === 'ask';

	return (
		<div
			ref={rowRef}
			data-ob-row
			onClick={handleClick}
			className="relative grid min-h-[22px] flex-1 cursor-pointer grid-cols-3 items-center text-xs hover:bg-muted/30"
		>
			<div
				className="absolute inset-y-0 left-0 transition-[width] duration-[50ms] ease-out"
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
