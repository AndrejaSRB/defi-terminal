import { memo } from 'react';
import { cn } from '@/lib/utils';
import { summarizeRoute, formatDuration } from '@/services/lifi/route-summary';
import type { Route } from '@lifi/sdk';

interface RouteCardProps {
	route: Route;
	destinationDecimals: number;
	isSelected: boolean;
	onSelect: () => void;
}

const RouteCard = ({
	route,
	destinationDecimals,
	isSelected,
	onSelect,
}: RouteCardProps) => {
	const summary = summarizeRoute(route);
	if (!summary) return null;

	const receiveAmount = (
		Number(summary.toAmount) /
		10 ** destinationDecimals
	).toFixed(2);

	const isCheapest = route.tags?.includes('CHEAPEST') ?? false;
	const isFastest = route.tags?.includes('FASTEST') ?? false;

	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
				isSelected
					? 'border-primary bg-primary/5'
					: 'border-border hover:border-primary/30 hover:bg-muted/30',
			)}
		>
			{summary.bridgeLogo && (
				<img
					src={summary.bridgeLogo}
					alt={summary.bridgeName}
					className="size-8 rounded-full"
				/>
			)}

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-foreground">
						{summary.bridgeName}
					</span>
					{isCheapest && (
						<span className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
							Cheapest
						</span>
					)}
					{isFastest && (
						<span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
							Fastest
						</span>
					)}
				</div>
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<span>{formatDuration(summary.totalDuration)}</span>
					<span>·</span>
					<span>${summary.totalCostUsd.toFixed(2)} fee</span>
				</div>
			</div>

			<span className="text-sm font-semibold tabular-nums text-foreground">
				{receiveAmount}
			</span>
		</button>
	);
};

export default memo(RouteCard);
