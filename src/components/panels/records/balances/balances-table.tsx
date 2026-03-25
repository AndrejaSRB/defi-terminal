import type { FormattedBalance } from './hooks/use-balances-data';

const COLUMNS = [
	'Coin',
	'Total Balance',
	'Available Balance',
	'USDC Value',
] as const;

export function BalancesTable({ balances }: { balances: FormattedBalance[] }) {
	return (
		<div className="relative h-full overflow-x-auto no-scrollbar">
			<table className="w-full min-w-[500px] text-xs">
				<thead className="sticky top-0 z-10 bg-card">
					<tr className="border-b border-border">
						{COLUMNS.map((col) => (
							<th
								key={col}
								className="whitespace-nowrap px-2 py-1.5 text-left font-medium text-muted-foreground"
							>
								{col}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{balances.map((b) => (
						<tr
							key={b.coin}
							className="border-b border-border/50 hover:bg-muted/30"
						>
							<td className="whitespace-nowrap px-2 py-1.5 font-medium">
								{b.coin}
							</td>
							<td className="whitespace-nowrap px-2 py-1.5">
								{b.totalBalance}
							</td>
							<td className="whitespace-nowrap px-2 py-1.5">
								{b.availableBalance}
							</td>
							<td className="whitespace-nowrap px-2 py-1.5">{b.usdValue}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
