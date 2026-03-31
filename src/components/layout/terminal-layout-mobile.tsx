import { useState, useCallback } from 'react';
import { BarChart3, ArrowLeftRight, ClipboardList, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TopBar } from './top-bar';
import { TokenHeader } from './token-header/token-header';
import { ChartPanel } from '@/components/panels/chart/chart-panel';
import { OrderbookPanel } from '@/components/panels/orderbook/orderbook-panel';
import { OrderFormPanel } from '@/components/panels/order-form/order-form-panel';
import { RecordsPanel } from '@/components/panels/records/records-panel';
import { AccountPanel } from '@/components/panels/account-panel';

type MobileTab = 'chart' | 'trade' | 'orders' | 'account';

const TABS: { id: MobileTab; label: string; icon: typeof BarChart3 }[] = [
	{ id: 'chart', label: 'Chart', icon: BarChart3 },
	{ id: 'trade', label: 'Trade', icon: ArrowLeftRight },
	{ id: 'orders', label: 'Orders', icon: ClipboardList },
	{ id: 'account', label: 'Account', icon: Wallet },
];

export function TerminalLayoutMobile() {
	const [activeTab, setActiveTab] = useState<MobileTab>('chart');

	const handleTabChange = useCallback((tab: MobileTab) => {
		setActiveTab(tab);
	}, []);

	return (
		<div className="flex h-[100dvh] flex-col bg-background text-foreground">
			<TopBar />
			<TokenHeader />

			{/* Tab content — fills remaining space */}
			<div className="flex-1 overflow-hidden">
				{/* Chart tab */}
				<div className={cn('h-full', activeTab !== 'chart' && 'hidden')}>
					<div className="relative h-full overflow-hidden bg-card">
						<ChartPanel />
					</div>
				</div>

				{/* Trade tab — orderbook + order form */}
				{activeTab === 'trade' && (
					<div className="flex h-full flex-col overflow-y-auto overscroll-none">
						<div className="h-[60%] min-h-[320px] border-b border-border">
							<OrderbookPanel />
						</div>
						<div className="min-h-[400px]">
							<OrderFormPanel />
						</div>
					</div>
				)}

				{/* Orders tab */}
				{activeTab === 'orders' && (
					<div className="h-full overflow-y-auto overscroll-none">
						<RecordsPanel />
					</div>
				)}

				{/* Account tab */}
				{activeTab === 'account' && (
					<div className="h-full overflow-y-auto overscroll-none">
						<AccountPanel />
					</div>
				)}
			</div>

			{/* Bottom tab bar */}
			<div className="flex shrink-0 items-center border-t border-border bg-card">
				{TABS.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => handleTabChange(tab.id)}
							className={cn(
								'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
								isActive ? 'text-primary' : 'text-muted-foreground',
							)}
						>
							<Icon className="size-5" />
							<span>{tab.label}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
