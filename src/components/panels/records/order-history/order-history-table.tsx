import { cn } from '@/lib/utils';
import { directionColor } from '@/lib/colors';
import { CoinLink } from '../components/coin-link';
import type { FormattedHistoricalOrder } from './hooks/use-order-history-data';

const COLUMNS = [
	'Time',
	'Type',
	'Coin',
	'Direction',
	'Size',
	'Filled Size',
	'Order Value',
	'Price',
	'Reduce Only',
	'Trigger Conditions',
	'TP/SL',
	'Status',
] as const;

export function OrderHistoryTable({
	orders,
}: {
	orders: FormattedHistoricalOrder[];
}) {
	return (
		<div className="relative h-full overflow-x-auto no-scrollbar">
			<table className="w-full min-w-[1100px] text-xs">
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
						const tpsl =
							order.tp || order.sl
								? [order.tp ?? '-', order.sl ?? '-'].join(' / ')
								: '-';

						return (
							<tr
								key={`${order.id}-${order.status}`}
								className="border-b border-border/50 hover:bg-muted/30"
							>
								<td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
									{order.time}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{order.orderType}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									<CoinLink
										coin={order.coin}
										displayName={order.displayName}
										dexName={order.dexName}
									/>
								</td>
								<td
									className={cn(
										'whitespace-nowrap px-2 py-1.5',
										directionColor(order.dir),
									)}
								>
									{order.dir}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">{order.size}</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{order.filledSize}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{order.orderValue}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">{order.price}</td>
								<td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
									{order.reduceOnly ? 'Yes' : 'No'}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
									{order.triggerCondition ?? '-'}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
									{tpsl}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{order.status}
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
