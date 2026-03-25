import { cn } from '@/lib/utils';
import type { FormattedOrder } from './hooks/use-orders-data';

interface OrderCardProps {
	order: FormattedOrder;
	onSelectToken: (coin: string) => void;
}

export function OrderCard({ order: o, onSelectToken }: OrderCardProps) {
	const sideColor =
		o.side === 'buy'
			? 'text-green-400 bg-green-400/10'
			: 'text-red-400 bg-red-400/10';

	return (
		<div className="rounded-md border border-border bg-card p-3 text-xs">
			<div className="flex items-center justify-between">
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
					<span
						className={cn(
							'rounded px-1 py-px text-[10px] font-medium uppercase',
							sideColor,
						)}
					>
						{o.side}
					</span>
					<span className="rounded bg-muted px-1 py-px text-[10px]">
						{o.orderType}
					</span>
				</div>
				<span className="text-muted-foreground">{o.timestamp}</span>
			</div>

			<div className="mt-2 grid grid-cols-2 gap-y-1.5 text-muted-foreground">
				<div>
					<span>Price</span>
					<div className="text-foreground">{o.price}</div>
				</div>
				<div className="text-right">
					<span>Size</span>
					<div className="text-foreground">{o.size}</div>
				</div>
				<div>
					<span>Filled</span>
					<div className="text-foreground">{o.filled}</div>
				</div>
				{o.triggerPrice && (
					<div className="text-right">
						<span>Trigger</span>
						<div className="text-foreground">{o.triggerPrice}</div>
					</div>
				)}
			</div>
		</div>
	);
}
