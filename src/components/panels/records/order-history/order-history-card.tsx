import { cn } from '@/lib/utils';
import { directionColor } from '@/lib/colors';
import { CoinLink } from '../components/coin-link';
import type { FormattedHistoricalOrder } from './hooks/use-order-history-data';

export function OrderHistoryCard({
	order,
}: {
	order: FormattedHistoricalOrder;
}) {
	return (
		<div className="rounded-md border border-border bg-card p-3 text-xs">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5">
					<CoinLink
						coin={order.coin}
						displayName={order.displayName}
						dexName={order.dexName}
					/>
					<span className={cn('text-[11px]', directionColor(order.dir))}>
						{order.dir}
					</span>
				</div>
				<span className="text-muted-foreground">{order.time}</span>
			</div>

			<div className="mt-2 grid grid-cols-2 gap-y-1.5 text-muted-foreground">
				<div>
					<span>Type</span>
					<div className="text-foreground">{order.orderType}</div>
				</div>
				<div className="text-right">
					<span>Status</span>
					<div className="text-foreground">{order.status}</div>
				</div>
				<div>
					<span>Price</span>
					<div className="text-foreground">{order.price}</div>
				</div>
				<div className="text-right">
					<span>Size</span>
					<div className="text-foreground">{order.size}</div>
				</div>
				<div>
					<span>Filled</span>
					<div className="text-foreground">{order.filledSize}</div>
				</div>
				<div className="text-right">
					<span>Order Value</span>
					<div className="text-foreground">{order.orderValue}</div>
				</div>
			</div>
		</div>
	);
}
