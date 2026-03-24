import { Component, lazy, Suspense, type ReactNode } from 'react';
import { ChartSkeleton } from './chart-skeleton';

const TradingViewChart = lazy(() => import('./trading-view-chart'));

class ChartErrorBoundary extends Component<
	{ children: ReactNode },
	{ error: string | null }
> {
	state = { error: null as string | null };

	static getDerivedStateFromError(error: Error) {
		return { error: error.message };
	}

	render() {
		if (this.state.error) {
			return (
				<div className="flex h-full w-full items-center justify-center">
					<div className="text-center">
						<p className="mb-2 text-sm text-muted-foreground">
							{this.state.error}
						</p>
						<button
							type="button"
							onClick={() => this.setState({ error: null })}
							className="text-sm text-primary underline"
						>
							Retry
						</button>
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}

export function ChartPanel() {
	return (
		<ChartErrorBoundary>
			<Suspense fallback={<ChartSkeleton />}>
				<TradingViewChart />
			</Suspense>
		</ChartErrorBoundary>
	);
}
