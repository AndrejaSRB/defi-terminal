import type { Route } from '@lifi/sdk';

export interface RouteSummary {
	bridgeName: string;
	bridgeLogo: string | undefined;
	totalDuration: number;
	totalFeeUsd: number;
	totalGasUsd: number;
	totalCostUsd: number;
	toAmount: string;
}

export function summarizeRoute(route: Route): RouteSummary | null {
	const firstStep = route.steps[0];
	const lastStep = route.steps[route.steps.length - 1];
	if (!firstStep || !lastStep) return null;

	const bridgeName = firstStep.toolDetails.name;
	const bridgeLogo = firstStep.toolDetails.logoURI;

	const totalDuration = route.steps.reduce(
		(sum, step) => sum + step.estimate.executionDuration,
		0,
	);

	const totalFeeUsd = route.steps.reduce((sum, step) => {
		const stepFees = (step.estimate.feeCosts ?? []).reduce(
			(feeSum, fee) => feeSum + Number(fee.amountUSD ?? 0),
			0,
		);
		return sum + stepFees;
	}, 0);

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

export function formatDuration(seconds: number): string {
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.ceil(seconds / 60);
	return `~${minutes} min`;
}
