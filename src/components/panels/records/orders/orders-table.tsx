import { cn } from '@/lib/utils';
import type { FormattedOrder } from './hooks/use-orders-data';

const COLUMNS = [
	'Token',
	'Side',
	'Type',
	'Price',
	'Size',
	'Filled',
	'Trigger',
	'TP/SL',
	'Time',
] as const;

interface OrdersTableProps {
	orders: FormattedOrder[];
	onSelectToken: (coin: string) => void;
}

export function OrdersTable({ orders, onSelectToken }: OrdersTableProps) {
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
					{orders.map((o) => {
						const sideColor =
							o.side === 'buy'
								? 'text-green-400 bg-green-400/10'
								: 'text-red-400 bg-red-400/10';

						return (
							<tr
								key={o.id}
								className="border-b border-border/50 hover:bg-muted/30"
							>
								<td className="whitespace-nowrap px-2 py-1.5">
									<div className="flex items-center gap-1.5">
										<button
											type="button"
											onClick={() => onSelectToken(o.coin)}
											className="font-bold uppercase transition-colors hover:text-primary"
										>
											{o.displayName}
										</button>
										{o.dexName && (
											<span className="text-[11px] text-muted-foreground">
												{o.dexName}
											</span>
										)}
										{o.isReduceOnly && (
											<span className="rounded bg-muted px-1 py-px text-[10px] text-muted-foreground">
												RO
											</span>
										)}
									</div>
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									<span
										className={cn(
											'rounded px-1 py-px text-[10px] font-medium uppercase',
											sideColor,
										)}
									>
										{o.side}
									</span>
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									<span className="rounded bg-muted px-1 py-px text-[10px]">
										{o.orderType}
									</span>
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">{o.price}</td>
								<td className="whitespace-nowrap px-2 py-1.5">{o.size}</td>
								<td className="whitespace-nowrap px-2 py-1.5">{o.filled}</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{o.triggerPrice ?? '--'}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{o.tp ?? '--'} / {o.sl ?? '--'}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
									{o.timestamp}
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
