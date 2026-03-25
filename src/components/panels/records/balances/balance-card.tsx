import type { FormattedBalance } from './hooks/use-balances-data';

export function BalanceCard({ balance: b }: { balance: FormattedBalance }) {
	return (
		<div className="rounded-md border border-border bg-card p-3 text-xs">
			<div className="flex items-center justify-between">
				<span className="font-bold">{b.coin}</span>
				<span className="text-muted-foreground">{b.type}</span>
			</div>
			<div className="mt-2 grid grid-cols-2 gap-y-1.5 text-muted-foreground">
				<div>
					<span>Total</span>
					<div className="text-foreground">{b.totalBalance}</div>
				</div>
				<div className="text-right">
					<span>Available</span>
					<div className="text-foreground">{b.availableBalance}</div>
				</div>
				<div>
					<span>USDC Value</span>
					<div className="text-foreground">{b.usdValue}</div>
				</div>
			</div>
		</div>
	);
}
