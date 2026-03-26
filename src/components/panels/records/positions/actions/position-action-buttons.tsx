import { memo } from 'react';
import type { FormattedPosition } from '../hooks/use-positions-data';

interface PositionActionButtonsProps {
	position: FormattedPosition;
	onLimitClose: (position: FormattedPosition) => void;
	onMarketClose: (position: FormattedPosition) => void;
	onReverse: (position: FormattedPosition) => void;
	disabled: boolean;
}

export const PositionActionButtons = memo(function PositionActionButtons({
	position,
	onLimitClose,
	onMarketClose,
	onReverse,
	disabled,
}: PositionActionButtonsProps) {
	return (
		<div className="flex items-center justify-end gap-2 text-[11px]">
			<button
				type="button"
				disabled={disabled}
				onClick={() => onLimitClose(position)}
				className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
			>
				Limit
			</button>
			<button
				type="button"
				disabled={disabled}
				onClick={() => onMarketClose(position)}
				className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
			>
				Market
			</button>
			<button
				type="button"
				disabled={disabled}
				onClick={() => onReverse(position)}
				className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
			>
				Reverse
			</button>
		</div>
	);
});
