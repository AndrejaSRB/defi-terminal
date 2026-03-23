import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { FormattedLevel } from './hooks/use-orderbook-data';

const ASK_GRADIENT =
	'linear-gradient(to right, rgba(235, 54, 90, 0.35) 0%, rgba(235, 54, 90, 0.2) 40%, rgba(235, 54, 90, 0.08) 100%)';
const BID_GRADIENT =
	'linear-gradient(to right, rgba(2, 199, 123, 0.35) 0%, rgba(2, 199, 123, 0.2) 40%, rgba(2, 199, 123, 0.08) 100%)';

export const OrderBookRow = memo(function OrderBookRow({
	level,
}: {
	level: FormattedLevel;
}) {
	const isAsk = level.side === 'ask';

	return (
		<div
			data-ob-row
			className="relative grid cursor-pointer grid-cols-3 text-xs hover:bg-muted/30"
		>
			<div
				className="absolute inset-y-0 left-0 transition-[width] duration-[50ms] ease-out"
				style={{
					width: `${level.depthPercent}%`,
					background: isAsk ? ASK_GRADIENT : BID_GRADIENT,
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
