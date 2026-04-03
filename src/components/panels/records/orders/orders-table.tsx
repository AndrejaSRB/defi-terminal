import { cn } from '@/lib/utils';
import { directionColor } from '@/lib/colors';
import { CoinLink } from '../components/coin-link';
import { CancelAllDialog } from './actions/cancel-all-dialog';
import type { FormattedOrder } from './hooks/use-orders-data';

const COLUMNS = [
	'Time',
	'Type',
	'Coin',
	'Direction',
	'Size',
	'Orig Size',
	'Order Value',
	'Price',
	'Reduce Only',
	'Trigger',
	'TP/SL',
] as const;

interface OrdersTableProps {
	orders: FormattedOrder[];
	isProcessing: boolean;
	onCancel: (orderId: number, coin: string, externalId?: string | null) => void;
	onCancelAll: () => void;
	onEdit: (order: FormattedOrder) => void;
}

export function OrdersTable({
	orders,
	isProcessing,
	onCancel,
	onCancelAll,
	onEdit,
}: OrdersTableProps) {
	return (
		<div className="relative h-full overflow-x-auto no-scrollbar">
			<table className="w-full min-w-[1200px] text-xs">
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
						<th className="whitespace-nowrap px-2 py-1.5 text-right font-medium">
							{orders.length > 0 ? (
								<CancelAllDialog
									onConfirm={onCancelAll}
									isProcessing={isProcessing}
								/>
							) : (
								<span className="text-muted-foreground font-medium">
									Actions
								</span>
							)}
						</th>
					</tr>
				</thead>
				<tbody>
					{orders.map((order) => (
						<tr
							key={order.id}
							className="border-b border-border/50 hover:bg-muted/30"
						>
							<td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
								{order.time}
							</td>
							<td className="whitespace-nowrap px-2 py-1.5">{order.type}</td>
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
									directionColor(
										order.direction === 'Long' ||
											order.direction === 'Close Short'
											? 'Open Long'
											: 'Open Short',
									),
								)}
							>
								{order.direction}
							</td>
							<td className="whitespace-nowrap px-2 py-1.5">
								<div className="flex items-center gap-1">
									<span
										className={cn(
											order.isPositionTpsl && 'text-muted-foreground',
										)}
									>
										{order.size}
									</span>
									{order.isLimitOrder && (
										<button
											type="button"
											onClick={() => onEdit(order)}
											className="text-muted-foreground hover:text-foreground"
										>
											<EditIcon />
										</button>
									)}
								</div>
							</td>
							<td className="whitespace-nowrap px-2 py-1.5">
								{order.originalSize}
							</td>
							<td className="whitespace-nowrap px-2 py-1.5">
								{order.orderValue}
							</td>
							<td className="whitespace-nowrap px-2 py-1.5">
								<div className="flex items-center gap-1">
									<span>{order.price}</span>
									{order.isLimitOrder && (
										<button
											type="button"
											onClick={() => onEdit(order)}
											className="text-muted-foreground hover:text-foreground"
										>
											<EditIcon />
										</button>
									)}
								</div>
							</td>
							<td className="whitespace-nowrap px-2 py-1.5">
								{order.reduceOnly}
							</td>
							<td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
								{order.triggerCondition}
							</td>
							<td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
								{order.tpsl}
							</td>
							<td className="whitespace-nowrap px-2 py-1.5 text-right">
								<button
									type="button"
									disabled={isProcessing}
									onClick={() =>
										onCancel(order.rawOrderId, order.coin, order.rawExternalId)
									}
									className="text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
								>
									Cancel
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function EditIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="11"
			height="11"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
		</svg>
	);
}
