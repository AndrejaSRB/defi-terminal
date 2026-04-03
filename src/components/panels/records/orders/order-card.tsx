import { cn } from '@/lib/utils';
import { directionColor } from '@/lib/colors';
import { CoinLink } from '../components/coin-link';
import type { FormattedOrder } from './hooks/use-orders-data';

interface OrderCardProps {
	order: FormattedOrder;
	isProcessing: boolean;
	onCancel: (orderId: number, coin: string, externalId?: string | null) => void;
}

export function OrderCard({ order, isProcessing, onCancel }: OrderCardProps) {
	return (
		<div className="rounded-md border border-border bg-card p-3 text-xs">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5">
					<CoinLink
						coin={order.coin}
						displayName={order.displayName}
						dexName={order.dexName}
					/>
					<span
						className={cn(
							'text-[11px]',
							directionColor(
								order.direction === 'Long' || order.direction === 'Close Short'
									? 'Open Long'
									: 'Open Short',
							),
						)}
					>
						{order.direction}
					</span>
					<span className="rounded bg-muted px-1 py-px text-[10px]">
						{order.type}
					</span>
				</div>
				<span className="text-muted-foreground">{order.time}</span>
			</div>

			<div className="mt-2 grid grid-cols-2 gap-y-1.5 text-muted-foreground">
				<div>
					<span>Price</span>
					<div className="text-foreground">{order.price}</div>
				</div>
				<div className="text-right">
					<span>Size</span>
					<div className="text-foreground">{order.size}</div>
				</div>
				<div>
					<span>Order Value</span>
					<div className="text-foreground">{order.orderValue}</div>
				</div>
				<div className="text-right">
					<span>Reduce Only</span>
					<div className="text-foreground">{order.reduceOnly}</div>
				</div>
				{order.triggerCondition !== 'N/A' && (
					<div className="col-span-2">
						<span>Trigger</span>
						<div className="text-foreground">{order.triggerCondition}</div>
					</div>
				)}
			</div>

			<div className="mt-2 border-t border-border pt-2">
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
			</div>
		</div>
	);
}
