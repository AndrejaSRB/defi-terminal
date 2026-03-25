import { cn } from '@/lib/utils';
import { sentimentColor, directionColor } from '@/lib/colors';
import type { FormattedFill } from './hooks/use-fills-data';

interface FillCardProps {
	fill: FormattedFill;
	onSelectToken: (coin: string) => void;
}

export function FillCard({ fill: f, onSelectToken }: FillCardProps) {
	return (
		<div className="rounded-md border border-border bg-card p-3 text-xs">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={() => onSelectToken(f.coin)}
						className="font-bold uppercase transition-colors hover:text-primary"
					>
						{f.displayName}
					</button>
					{f.dexName && (
						<span className="text-[11px] text-muted-foreground">
							{f.dexName}
						</span>
					)}
					<span className={cn('text-[11px]', directionColor(f.dir))}>
						{f.dir}
					</span>
				</div>
				<span className="text-muted-foreground">{f.time}</span>
			</div>

			<div className="mt-2 grid grid-cols-2 gap-y-1.5 text-muted-foreground">
				<div>
					<span>Price</span>
					<div className="text-foreground">{f.price}</div>
				</div>
				<div className="text-right">
					<span>Size</span>
					<div className="text-foreground">{f.size}</div>
				</div>
				<div>
					<span>Trade Value</span>
					<div className="text-foreground">{f.tradeValue}</div>
				</div>
				<div className="text-right">
					<span>Fee</span>
					<div className="text-foreground">{f.fee}</div>
				</div>
				<div>
					<span>Closed PNL</span>
					<div className={sentimentColor(f.closedPnlValue)}>{f.closedPnl}</div>
				</div>
			</div>
		</div>
	);
}
