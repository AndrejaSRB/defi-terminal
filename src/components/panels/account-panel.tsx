import { Button } from '@/components/ui/button';

export function AccountPanel() {
	return (
		<div className="flex h-full flex-col gap-3 overflow-y-auto p-3">
			<div className="grid grid-cols-2 gap-2">
				<Button size="sm">Deposit</Button>
				<Button size="sm" variant="secondary">
					Withdraw
				</Button>
			</div>

			<div className="space-y-2 text-xs">
				<h3 className="font-medium text-foreground">Account Equity</h3>
				<div className="space-y-1 text-muted-foreground">
					<div className="flex justify-between">
						<span>Spot</span>
						<span className="text-foreground">--</span>
					</div>
					<div className="flex justify-between">
						<span>Perps (Core)</span>
						<span className="text-foreground">--</span>
					</div>
				</div>
			</div>

			<div className="space-y-2 text-xs">
				<h3 className="font-medium text-foreground">Perps Overview</h3>
				<div className="space-y-1 text-muted-foreground">
					<div className="flex justify-between">
						<span>Balance</span>
						<span className="text-foreground">--</span>
					</div>
					<div className="flex justify-between">
						<span>Unrealized PNL</span>
						<span className="text-foreground">--</span>
					</div>
					<div className="flex justify-between">
						<span>Cross Margin Ratio</span>
						<span className="text-foreground">--</span>
					</div>
					<div className="flex justify-between">
						<span>Maintenance Margin</span>
						<span className="text-foreground">--</span>
					</div>
					<div className="flex justify-between">
						<span>Cross Account Leverage</span>
						<span className="text-foreground">--</span>
					</div>
				</div>
			</div>
		</div>
	);
}
