import { TopBar } from './top-bar';
import { TokenHeader } from './token-header';
import { StatusBar } from './status-bar';
import { ChartPanel } from '@/components/panels/chart-panel';
import { OrderbookPanel } from '@/components/panels/orderbook-panel';
import { OrderFormPanel } from '@/components/panels/order-form-panel';
import { RecordsPanel } from '@/components/panels/records-panel';
import { AccountPanel } from '@/components/panels/account-panel';

export function TerminalLayoutMobile() {
	return (
		<div className="flex h-screen flex-col bg-background text-foreground">
			<TopBar />
			<TokenHeader />

			<div className="flex-1 overflow-y-auto">
				{/* Chart */}
				<div className="h-[50vh] min-h-[300px] border-b border-border">
					<ChartPanel />
				</div>

				{/* Orderbook + Order Form */}
				<div className="flex min-h-[400px] border-b border-border">
					<div className="w-1/2 border-r border-border">
						<OrderbookPanel />
					</div>
					<div className="w-1/2">
						<OrderFormPanel />
					</div>
				</div>

				{/* Records */}
				<div className="min-h-[300px] border-b border-border">
					<RecordsPanel />
				</div>

				{/* Account */}
				<div className="min-h-[200px] border-b border-border">
					<AccountPanel />
				</div>
			</div>

			<StatusBar />
		</div>
	);
}
