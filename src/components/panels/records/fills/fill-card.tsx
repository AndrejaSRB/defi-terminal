import { cn } from '@/lib/utils';
import { sentimentColor, directionColor } from '@/lib/colors';
import { CoinLink } from '../components/coin-link';
import type { FormattedFill } from './hooks/use-fills-data';

export function FillCard({ fill }: { fill: FormattedFill }) {
	return (
		<div className="rounded-md border border-border bg-card p-3 text-xs">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5">
					<CoinLink
						coin={fill.coin}
						displayName={fill.displayName}
						dexName={fill.dexName}
					/>
					<span className={cn('text-[11px]', directionColor(fill.dir))}>
						{fill.dir}
					</span>
				</div>
				<span className="text-muted-foreground">{fill.time}</span>
			</div>

			<div className="mt-2 grid grid-cols-2 gap-y-1.5 text-muted-foreground">
				<div>
					<span>Price</span>
					<div className="text-foreground">{fill.price}</div>
				</div>
				<div className="text-right">
					<span>Size</span>
					<div className="text-foreground">{fill.size}</div>
				</div>
				<div>
					<span>Trade Value</span>
					<div className="text-foreground">{fill.tradeValue}</div>
				</div>
				<div className="text-right">
					<span>Fee</span>
					<div className="text-foreground">{fill.fee}</div>
				</div>
				<div>
					<span>Closed PNL</span>
					<div className={sentimentColor(fill.closedPnlValue)}>
						{fill.closedPnl}
					</div>
				</div>
			</div>
		</div>
	);
}
