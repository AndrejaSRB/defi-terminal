import { cn } from '@/lib/utils';
import { CoinLink } from '../components/coin-link';
import type { FormattedOrder } from './hooks/use-orders-data';

export function OrderCard({ order }: { order: FormattedOrder }) {
	const sideColor =
		order.side === 'buy'
			? 'text-green-400 bg-green-400/10'
			: 'text-red-400 bg-red-400/10';

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
							'rounded px-1 py-px text-[10px] font-medium uppercase',
							sideColor,
						)}
					>
						{order.side}
					</span>
					<span className="rounded bg-muted px-1 py-px text-[10px]">
						{order.orderType}
					</span>
				</div>
				<span className="text-muted-foreground">{order.timestamp}</span>
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
					<span>Filled</span>
					<div className="text-foreground">{order.filled}</div>
				</div>
				{order.triggerPrice && (
					<div className="text-right">
						<span>Trigger</span>
						<div className="text-foreground">{order.triggerPrice}</div>
					</div>
				)}
			</div>
		</div>
	);
}
