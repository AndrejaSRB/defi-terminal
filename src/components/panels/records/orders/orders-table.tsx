import { cn } from '@/lib/utils';
import { CoinLink } from '../components/coin-link';
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

export function OrdersTable({ orders }: { orders: FormattedOrder[] }) {
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
					{orders.map((order) => {
						const sideColor =
							order.side === 'buy'
								? 'text-green-400 bg-green-400/10'
								: 'text-red-400 bg-red-400/10';

						return (
							<tr
								key={order.id}
								className="border-b border-border/50 hover:bg-muted/30"
							>
								<td className="whitespace-nowrap px-2 py-1.5">
									<div className="flex items-center gap-1.5">
										<CoinLink
											coin={order.coin}
											displayName={order.displayName}
											dexName={order.dexName}
										/>
										{order.isReduceOnly && (
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
										{order.side}
									</span>
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									<span className="rounded bg-muted px-1 py-px text-[10px]">
										{order.orderType}
									</span>
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">{order.price}</td>
								<td className="whitespace-nowrap px-2 py-1.5">{order.size}</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{order.filled}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{order.triggerPrice ?? '--'}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{order.tp ?? '--'} / {order.sl ?? '--'}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
									{order.timestamp}
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
