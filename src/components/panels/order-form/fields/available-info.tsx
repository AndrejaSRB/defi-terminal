import { memo } from 'react';

interface AvailableInfoProps {
	availableMargin: string;
	currentPosition: { size: string; side: string } | null;
	token: string;
}

export const AvailableInfo = memo(function AvailableInfo({
	availableMargin,
	currentPosition,
	token,
}: AvailableInfoProps) {
	return (
		<div className="space-y-0.5 text-xs">
			<div className="flex justify-between">
				<span className="text-muted-foreground">Available to Trade</span>
				<span className="text-foreground">{availableMargin}</span>
			</div>
			<div className="flex justify-between">
				<span className="text-muted-foreground">Current Position</span>
				<span className="text-foreground">
					{currentPosition
						? `${currentPosition.size} ${token}`
						: `0.00 ${token}`}
				</span>
			</div>
		</div>
	);
});
