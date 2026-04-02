import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getChainName } from '@/services/chains/config';
import type { WidgetConfig } from './types';
import type { Route } from '@lifi/sdk';

interface DestinationPanelProps {
	config: WidgetConfig;
	selectedRoute: Route | null;
	isLoadingRoutes: boolean;
	isDirectDeposit: boolean;
	amount: string;
}

function getEstimatedReceiveAmount(route: Route, decimals: number): string {
	// Use the last step's estimate for the final output amount
	const lastStep = route.steps[route.steps.length - 1];
	if (!lastStep) return '--';
	return (Number(lastStep.estimate.toAmount) / 10 ** decimals).toFixed(2);
}

const DestinationPanel = ({
	config,
	selectedRoute,
	isLoadingRoutes,
	isDirectDeposit,
	amount,
}: DestinationPanelProps) => {
	const chainName = getChainName(config.destinationChainId);

	const displayAmount = isDirectDeposit
		? amount || '--'
		: selectedRoute
			? getEstimatedReceiveAmount(
					selectedRoute,
					config.destinationTokenDecimals,
				)
			: '--';

	return (
		<div className="rounded-xl border border-border bg-muted/20 p-4">
			<span className="text-xs font-medium text-muted-foreground">To</span>
			<div className="mt-3 flex items-center justify-between">
				<div>
					<p className="text-sm font-medium text-foreground">{chainName}</p>
					<p className="text-xs text-muted-foreground">
						{config.destinationTokenSymbol}
					</p>
				</div>
				{isLoadingRoutes ? (
					<Skeleton className="h-8 w-32" />
				) : (
					<p className="text-2xl font-semibold text-foreground tabular-nums">
						{displayAmount === '--'
							? '--'
							: `~${displayAmount} ${config.destinationTokenSymbol}`}
					</p>
				)}
			</div>
		</div>
	);
};

export default memo(DestinationPanel);
