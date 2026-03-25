import { cn } from '@/lib/utils';
import { sentimentColor } from '@/lib/colors';
import type { FormattedPosition } from './hooks/use-positions-data';

const COLUMNS = [
	'Token',
	'Size',
	'Position Value',
	'Entry Price',
	'Mark Price',
	'PnL (ROI%)',
	'Liq Price',
	'Margin',
	'Funding',
	'TP/SL',
] as const;

interface PositionsTableProps {
	positions: FormattedPosition[];
	onSelectToken: (coin: string) => void;
}

export function PositionsTable({
	positions,
	onSelectToken,
}: PositionsTableProps) {
	return (
		<div className="relative h-full overflow-x-auto no-scrollbar">
			<table className="w-full min-w-[900px] text-xs">
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
					{positions.map((p) => {
						const isLong = p.side === 'LONG';
						const badgeColor = isLong
							? 'text-green-400 bg-green-400/10'
							: 'text-red-400 bg-red-400/10';

						return (
							<tr
								key={p.coin}
								className="border-b border-border/50 hover:bg-muted/30"
							>
								<td className="whitespace-nowrap px-2 py-1.5">
									<div className="flex items-center gap-1.5">
										<button
											type="button"
											onClick={() => onSelectToken(p.coin)}
											className="font-bold uppercase transition-colors hover:text-primary"
										>
											{p.displayName}
										</button>
										{p.dexName && (
											<span className="text-[11px] text-muted-foreground">
												{p.dexName}
											</span>
										)}
										<span
											className={cn(
												'rounded px-1 py-px text-[10px] font-medium',
												badgeColor,
											)}
										>
											{p.side} {p.leverage}
										</span>
									</div>
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">{p.size}</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{p.positionValue}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{p.entryPrice}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">{p.markPrice}</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									<span
										className={cn(
											'inline-block min-w-[120px]',
											sentimentColor(p.pnlValue),
										)}
									>
										{p.pnl} ({p.roi})
									</span>
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{p.liquidationPrice}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{p.marginUsed}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">{p.funding}</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{p.tp ?? '--'} / {p.sl ?? '--'}
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
