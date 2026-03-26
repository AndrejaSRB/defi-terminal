import { memo } from 'react';
import { cn } from '@/lib/utils';
import { BUY_COLOR, SELL_COLOR, BUY_GLOW, SELL_GLOW } from '@/lib/colors';

interface SideToggleProps {
	value: 'long' | 'short';
	onChange: (value: 'long' | 'short') => void;
}

export const SideToggle = memo(function SideToggle({
	value,
	onChange,
}: SideToggleProps) {
	const isLong = value === 'long';

	return (
		<div className="relative flex rounded-md bg-muted p-0.5">
			<div
				className={cn(
					'absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-[5px] transition-all duration-200 ease-out',
					isLong
						? `left-0.5 ${BUY_COLOR} ${BUY_GLOW}`
						: `left-[calc(50%+2px)] ${SELL_COLOR} ${SELL_GLOW}`,
				)}
			/>
			<button
				type="button"
				onClick={() => onChange('long')}
				className={cn(
					'relative z-10 flex-1 rounded-[5px] px-2 py-1 text-center text-xs font-medium transition-colors duration-200 select-none',
					isLong ? 'text-white' : 'text-muted-foreground hover:text-foreground',
				)}
			>
				Buy / Long
			</button>
			<button
				type="button"
				onClick={() => onChange('short')}
				className={cn(
					'relative z-10 flex-1 rounded-[5px] px-2 py-1 text-center text-xs font-medium transition-colors duration-200 select-none',
					!isLong
						? 'text-white'
						: 'text-muted-foreground hover:text-foreground',
				)}
			>
				Sell / Short
			</button>
		</div>
	);
});
