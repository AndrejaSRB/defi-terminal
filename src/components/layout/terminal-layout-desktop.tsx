import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';
import { TopBar } from './top-bar';
import { TokenHeader } from './token-header';
import { StatusBar } from './status-bar';
import { ChartPanel } from '@/components/panels/chart-panel';
import { OrderbookPanel } from '@/components/panels/orderbook-panel';
import { OrderFormPanel } from '@/components/panels/order-form-panel';
import { RecordsPanel } from '@/components/panels/records-panel';
import { AccountPanel } from '@/components/panels/account-panel';

const H_HANDLE = { width: '100%', height: 4 };
const V_HANDLE = { width: 4, height: '100%' };

export function TerminalLayoutDesktop() {
	return (
		<div className="flex h-screen flex-col bg-background text-foreground">
			<TopBar />

			<ResizablePanelGroup orientation="horizontal" className="flex-1 p-1">
				{/* Left */}
				<ResizablePanel id="left-content-section" minSize={744}>
					<ResizablePanelGroup orientation="vertical">
						{/* Chart + Orderbook */}
						<ResizablePanel id="top-left-section" minSize={330}>
							<ResizablePanelGroup orientation="horizontal">
								<ResizablePanel id="chart-section" minSize={460}>
									<div className="flex h-full flex-col">
										<TokenHeader />
										<div className="relative flex-1 overflow-hidden rounded-sm border border-border bg-card">
											<ChartPanel />
										</div>
									</div>
								</ResizablePanel>

								<ResizableHandle style={V_HANDLE} />

								<ResizablePanel
									id="orderbook-section"
									defaultSize={322}
									minSize={280}
								>
									<div className="relative flex h-full flex-col overflow-hidden rounded-sm border border-border bg-card">
										<OrderbookPanel />
									</div>
								</ResizablePanel>
							</ResizablePanelGroup>
						</ResizablePanel>

						<ResizableHandle style={H_HANDLE} />

						{/* Records */}
						<ResizablePanel
							id="records-section"
							defaultSize={290}
							minSize={120}
						>
							<div className="relative h-full overflow-hidden rounded-sm border border-border bg-card">
								<RecordsPanel />
							</div>
						</ResizablePanel>
					</ResizablePanelGroup>
				</ResizablePanel>

				<ResizableHandle style={V_HANDLE} />

				{/* Right */}
				<ResizablePanel
					id="right-column-section"
					defaultSize={295}
					minSize={295}
				>
					<ResizablePanelGroup orientation="vertical">
						<ResizablePanel
							id="placeorder-section"
							defaultSize={295}
							minSize={295}
						>
							<div className="relative flex h-full flex-col overflow-hidden rounded-sm border border-border bg-card">
								<OrderFormPanel />
							</div>
						</ResizablePanel>

						<ResizableHandle style={H_HANDLE} />

						<ResizablePanel
							id="account-section"
							defaultSize={295}
							minSize={295}
						>
							<div className="relative flex h-full flex-col overflow-hidden rounded-sm border border-border bg-card">
								<AccountPanel />
							</div>
						</ResizablePanel>
					</ResizablePanelGroup>
				</ResizablePanel>
			</ResizablePanelGroup>

			<StatusBar />
		</div>
	);
}
