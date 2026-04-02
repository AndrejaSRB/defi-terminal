import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { Route } from '@lifi/sdk';

interface RouteCardProps {
	route: Route;
	destinationDecimals: number;
	isSelected: boolean;
	onSelect: () => void;
}

function summarizeRoute(route: Route) {
	const firstStep = route.steps[0];
	const lastStep = route.steps[route.steps.length - 1];
	if (!firstStep || !lastStep) return null;

	const bridgeName = firstStep.toolDetails.name;
	const bridgeLogo = firstStep.toolDetails.logoURI;

	// Aggregate execution duration across all steps
	const totalDuration = route.steps.reduce(
		(sum, step) => sum + step.estimate.executionDuration,
		0,
	);

	// Aggregate fees across all steps
	const totalFeeUsd = route.steps.reduce((sum, step) => {
		const stepFees = (step.estimate.feeCosts ?? []).reduce(
			(feeSum, fee) => feeSum + Number(fee.amountUSD ?? 0),
			0,
		);
		return sum + stepFees;
	}, 0);

	// Aggregate gas across all steps
	const totalGasUsd = route.steps.reduce((sum, step) => {
		const stepGas = (step.estimate.gasCosts ?? []).reduce(
			(gasSum, gas) => gasSum + Number(gas.amountUSD ?? 0),
			0,
		);
		return sum + stepGas;
	}, 0);

	return {
		bridgeName,
		bridgeLogo,
		totalDuration,
		totalFeeUsd,
		totalGasUsd,
		totalCostUsd: totalFeeUsd + totalGasUsd,
		toAmount: lastStep.estimate.toAmount,
	};
}

function formatDuration(seconds: number): string {
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.ceil(seconds / 60);
	return `~${minutes} min`;
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
			{/* Bridge logo */}
			{summary.bridgeLogo && (
				<img
					src={summary.bridgeLogo}
					alt={summary.bridgeName}
					className="size-8 rounded-full"
				/>
			)}

			{/* Route details */}
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

			{/* Receive amount */}
			<span className="text-sm font-semibold tabular-nums text-foreground">
				{receiveAmount}
			</span>
		</button>
	);
};

export default memo(RouteCard);
