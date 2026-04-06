import { memo } from 'react';
import { ArrowDown, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWidget } from './hooks/use-widget';
import SourcePanel from './source-panel';
import DestinationPanel from './destination-panel';
import RouteCard from './route-card';
import DepositInfo from './deposit-info';
import BridgeStepper from './bridge-stepper';
import WidgetButton from './widget-button';
import type { WidgetConfig } from './types';

interface WidgetProps {
	config: WidgetConfig;
}

const Widget = ({ config }: WidgetProps) => {
	const {
		form,
		isSpinning,
		depositStatus,
		bridgeExecution,
		selectedBridgeName,
		selectedChainName,
		handleRefresh,
		handleExecute,
		resetDeposit,
		resetBridge,
	} = useWidget({ config });

	// ── Direct deposit success ──
	if (depositStatus === 'success') {
		return (
			<div className="flex flex-col items-center gap-4 py-6">
				<CheckCircle2 className="size-12 text-green-400" />
				<div className="text-center">
					<p className="text-sm font-medium text-foreground">
						Deposit Submitted
					</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Your {config.destinationTokenSymbol} is being deposited to your
						trading account. This usually takes {config.directDepositTime}.
					</p>
				</div>
				<Button variant="secondary" onClick={resetDeposit}>
					Make Another Deposit
				</Button>
			</div>
		);
	}

	// ── Bridge execution / success ──
	if (
		bridgeExecution.status === 'executing' ||
		bridgeExecution.status === 'success'
	) {
		return (
			<div className="space-y-4">
				<div className="text-center">
					<p className="text-sm font-medium text-foreground">
						{bridgeExecution.status === 'success'
							? 'Deposit Complete'
							: 'Bridging in Progress'}
					</p>
					{bridgeExecution.status === 'executing' && (
						<p className="text-xs text-muted-foreground">
							Please do not close this window
						</p>
					)}
				</div>

				<BridgeStepper steps={bridgeExecution.steps} />

				{bridgeExecution.status === 'success' && (
					<div className="flex flex-col items-center gap-3 pt-2">
						<p className="text-center text-xs text-muted-foreground">
							Funds have arrived on {config.destinationName}.
						</p>
						<Button variant="secondary" onClick={resetBridge}>
							Make Another Transfer
						</Button>
					</div>
				)}
			</div>
		);
	}

	// ── Bridge error ──
	if (bridgeExecution.status === 'error') {
		return (
			<div className="space-y-4">
				<BridgeStepper steps={bridgeExecution.steps} />
				<div className="flex justify-center pt-2">
					<Button variant="secondary" onClick={resetBridge}>
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	// ── Main form ──
	return (
		<div className="space-y-3">
			<p className="text-xs text-muted-foreground">
				{form.isDirectDeposit
					? `Deposit ${config.destinationTokenSymbol} directly to your trading account.`
					: `Bridge tokens directly to ${config.destinationName}.`}
			</p>

			<SourcePanel
				chainOptions={form.chainOptions}
				availableTokens={form.availableTokens}
				selectedChainId={form.selectedChainId}
				effectiveTokenKey={form.effectiveTokenKey}
				selectedToken={form.selectedToken}
				amount={form.amount}
				amountError={form.amountError}
				isLoading={form.isLoadingTokens}
				onChainChange={form.setChain}
				onTokenChange={form.setToken}
				onAmountChange={form.setAmount}
				onMaxClick={form.handleMaxClick}
			/>

			<div className="flex justify-center">
				<div className="flex size-8 items-center justify-center rounded-full border border-border bg-card">
					<ArrowDown className="size-4 text-muted-foreground" />
				</div>
			</div>

			<DestinationPanel
				config={config}
				selectedRoute={form.selectedRoute}
				isLoadingRoutes={form.isLoadingRoutes}
				isDirectDeposit={form.isDirectDeposit}
				amount={form.amount}
			/>

			{form.isDirectDeposit && form.isValidAmount && (
				<DepositInfo config={config} amount={form.amount} />
			)}

			{!form.isDirectDeposit && form.routes.length > 0 && (
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground">
							Routes
						</span>
						<div className="flex items-center gap-1.5">
							{form.isCountdownRunning && (
								<span className="text-xs tabular-nums text-muted-foreground">
									{form.secondsLeft}s
								</span>
							)}
							<button
								type="button"
								onClick={handleRefresh}
								className="text-muted-foreground transition-colors hover:text-foreground"
							>
								<RefreshCw
									className={`size-3 ${isSpinning ? 'animate-spin' : ''}`}
								/>
							</button>
						</div>
					</div>
					<div className="space-y-1.5">
						{form.routes.map((route, routeIndex) => (
							<RouteCard
								key={route.id}
								route={route}
								destinationDecimals={config.destinationTokenDecimals}
								isSelected={routeIndex === form.selectedRouteIndex}
								onSelect={() => form.setSelectedRouteIndex(routeIndex)}
							/>
						))}
					</div>
				</div>
			)}

			<WidgetButton
				amount={form.amount}
				amountError={form.amountError}
				bridgeDepositError={form.bridgeDepositError}
				isValidAmount={form.isValidAmount}
				isDirectDeposit={form.isDirectDeposit}
				isLoadingRoutes={form.isLoadingRoutes}
				isDepositing={depositStatus === 'depositing'}
				hasRoute={form.selectedRoute !== null}
				needsChainSwitch={form.needsChainSwitch}
				chainName={selectedChainName}
				bridgeName={selectedBridgeName}
				destinationName={config.destinationName}
				onSwitchChain={form.handleSwitchChain}
				onExecute={handleExecute}
			/>
		</div>
	);
};

export default memo(Widget);
