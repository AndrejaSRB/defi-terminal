import { cn } from '@/lib/utils';
import { sentimentColor, directionColor } from '@/lib/colors';
import type { FormattedFill } from './hooks/use-fills-data';

const COLUMNS = [
	'Time',
	'Coin',
	'Direction',
	'Price',
	'Size',
	'Trade Value',
	'Fee',
	'Closed PNL',
] as const;

interface FillsTableProps {
	fills: FormattedFill[];
	onSelectToken: (coin: string) => void;
}

export function FillsTable({ fills, onSelectToken }: FillsTableProps) {
	return (
		<div className="relative h-full overflow-x-auto no-scrollbar">
			<table className="w-full min-w-[800px] text-xs">
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
					{fills.map((f) => {
						return (
							<tr
								key={f.id}
								className="border-b border-border/50 hover:bg-muted/30"
							>
								<td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
									{f.time}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									<button
										type="button"
										onClick={() => onSelectToken(f.coin)}
										className="font-bold uppercase transition-colors hover:text-primary"
									>
										{f.displayName}
									</button>
									{f.dexName && (
										<span className="ml-1 text-[11px] text-muted-foreground">
											{f.dexName}
										</span>
									)}
								</td>
								<td
									className={cn(
										'whitespace-nowrap px-2 py-1.5',
										directionColor(f.dir),
									)}
								>
									{f.dir}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">{f.price}</td>
								<td className="whitespace-nowrap px-2 py-1.5">{f.size}</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{f.tradeValue}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
									{f.fee}
								</td>
								<td
									className={cn(
										'whitespace-nowrap px-2 py-1.5',
										sentimentColor(f.closedPnlValue),
									)}
								>
									{f.closedPnl}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			<div className="pointer-events-none absolute bottom-0 right-0 top-0 w-8 bg-gradient-to-l from-card to-transparent" />
		</div>
	);
}
