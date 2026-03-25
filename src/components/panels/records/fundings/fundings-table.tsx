import { cn } from '@/lib/utils';
import { sentimentColor } from '@/lib/colors';
import { CoinLink } from '../components/coin-link';
import type { FormattedFunding } from './hooks/use-fundings-data';

const COLUMNS = [
	'Time',
	'Coin',
	'Size',
	'Position Side',
	'Payment',
	'Rate',
] as const;

export function FundingsTable({ fundings }: { fundings: FormattedFunding[] }) {
	return (
		<div className="relative h-full overflow-x-auto no-scrollbar">
			<table className="w-full min-w-[700px] text-xs">
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
					{fundings.map((funding) => (
						<tr
							key={funding.id}
							className="border-b border-border/50 hover:bg-muted/30"
						>
							<td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
								{funding.time}
							</td>
							<td className="whitespace-nowrap px-2 py-1.5">
								<CoinLink
									coin={funding.coin}
									displayName={funding.displayName}
									dexName={funding.dexName}
								/>
							</td>
							<td className="whitespace-nowrap px-2 py-1.5">{funding.size}</td>
							<td
								className={cn(
									'whitespace-nowrap px-2 py-1.5',
									funding.side === 'Long' ? 'text-green-400' : 'text-red-400',
								)}
							>
								{funding.side}
							</td>
							<td
								className={cn(
									'whitespace-nowrap px-2 py-1.5',
									sentimentColor(funding.paymentValue),
								)}
							>
								{funding.payment}
							</td>
							<td className="whitespace-nowrap px-2 py-1.5">{funding.rate}</td>
						</tr>
					))}
				</tbody>
			</table>
			<div className="pointer-events-none absolute bottom-0 right-0 top-0 w-8 bg-gradient-to-l from-card to-transparent" />
		</div>
	);
}
