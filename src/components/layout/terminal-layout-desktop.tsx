import { useAtomValue } from 'jotai';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';
import { panelVisibilityAtom } from '@/atoms/settings';
import { TopBar } from './top-bar';
import { TokenHeader } from './token-header/token-header';
import { StatusBar } from './status-bar';
import { ChartPanel } from '@/components/panels/chart/chart-panel';
import { OrderbookPanel } from '@/components/panels/orderbook/orderbook-panel';
import { OrderFormPanel } from '@/components/panels/order-form/order-form-panel';
import { RecordsPanel } from '@/components/panels/records/records-panel';
import { AccountPanel } from '@/components/panels/account-panel';
import { useMediaQuery } from '@/hooks/use-media-query';

const H_HANDLE = { width: '100%', height: 4 };
const V_HANDLE = { width: 4, height: '100%' };

export function TerminalLayoutDesktop() {
	const isXl = useMediaQuery('(min-width: 1280px)');
	const visibility = useAtomValue(panelVisibilityAtom);

	const showChart = visibility.chart;
	const showOrderbook = visibility.orderbook;
	const showRecords = visibility.records;
	const showOrderForm = visibility.orderForm;
	const showAccount = visibility.account;

	const showTopLeft = showChart || showOrderbook;
	const showLeft = showTopLeft || showRecords;
	const showRight = showOrderForm || showAccount;

	// Key forces remount when visibility changes so panels resize correctly
	const layoutKey = Object.values(visibility).map(Number).join('');

	return (
		<div className="flex h-screen flex-col bg-background text-foreground">
			<TopBar />

			<ResizablePanelGroup
				key={layoutKey}
				orientation="horizontal"
				className="flex-1 p-1"
			>
				{/* Left */}
				{showLeft && (
					<ResizablePanel id="left-content-section" minSize={isXl ? 744 : 500}>
						<ResizablePanelGroup orientation="vertical">
							{/* Chart + Orderbook */}
							{showTopLeft && (
								<ResizablePanel
									id="top-left-section"
									minSize={isXl ? 330 : 250}
								>
									<ResizablePanelGroup orientation="horizontal">
										{showChart && (
											<ResizablePanel
												id="chart-section"
												minSize={isXl ? 460 : 300}
											>
												<div className="flex h-full flex-col">
													<TokenHeader />
													<div className="relative flex-1 overflow-hidden rounded-sm border border-border bg-card">
														<ChartPanel />
													</div>
												</div>
											</ResizablePanel>
										)}

										{showChart && showOrderbook && (
											<ResizableHandle style={V_HANDLE} />
										)}

										{showOrderbook && (
											<ResizablePanel
												id="orderbook-section"
												defaultSize={isXl ? 322 : 260}
												minSize={isXl ? 280 : 220}
											>
												<div className="relative flex h-full flex-col overflow-hidden rounded-sm border border-border bg-card">
													<OrderbookPanel />
												</div>
											</ResizablePanel>
										)}
									</ResizablePanelGroup>
								</ResizablePanel>
							)}

							{showTopLeft && showRecords && (
								<ResizableHandle style={H_HANDLE} />
							)}

							{/* Records */}
							{showRecords && (
								<ResizablePanel
									id="records-section"
									defaultSize={isXl ? 490 : 236}
									minSize={isXl ? 340 : 236}
								>
									<div className="relative h-full overflow-hidden rounded-sm border border-border bg-card">
										<RecordsPanel />
									</div>
								</ResizablePanel>
							)}
						</ResizablePanelGroup>
					</ResizablePanel>
				)}

				{showLeft && showRight && <ResizableHandle style={V_HANDLE} />}

				{/* Right */}
				{showRight && (
					<ResizablePanel
						id="right-column-section"
						defaultSize={295}
						minSize={isXl ? 295 : 260}
					>
						<ResizablePanelGroup orientation="vertical">
							{showOrderForm && (
								<ResizablePanel id="placeorder-section" minSize={740}>
									<div className="relative flex h-full flex-col overflow-hidden rounded-sm border border-border bg-card">
										<OrderFormPanel />
									</div>
								</ResizablePanel>
							)}

							{showOrderForm && showAccount && (
								<ResizableHandle style={H_HANDLE} />
							)}

							{showAccount && (
								<ResizablePanel id="account-section" minSize={150}>
									<div className="relative flex h-full flex-col overflow-hidden rounded-sm border border-border bg-card">
										<AccountPanel />
									</div>
								</ResizablePanel>
							)}
						</ResizablePanelGroup>
					</ResizablePanel>
				)}
			</ResizablePanelGroup>

			<StatusBar />
		</div>
	);
}
