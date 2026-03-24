import { cn } from '@/lib/utils';
import { sentimentColor } from '@/lib/colors';
import type { FormattedPosition } from './hooks/use-positions-data';

interface PositionCardProps {
	position: FormattedPosition;
	onSelectToken: (coin: string) => void;
}

export function PositionCard({
	position: p,
	onSelectToken,
}: PositionCardProps) {
	const isLong = p.side === 'LONG';
	const badgeColor = isLong
		? 'text-green-400 bg-green-400/10'
		: 'text-red-400 bg-red-400/10';

	return (
		<div className="rounded-md border border-border bg-card p-3 text-xs">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={() => onSelectToken(p.coin)}
						className="font-bold uppercase transition-colors hover:text-primary"
					>
						{p.displayName}
					</button>
					{p.dexName && (
						<span className="text-[11px] text-muted-foreground">
							{p.dexName}
						</span>
					)}
					<span
						className={cn(
							'rounded px-1 py-px text-[10px] font-medium',
							badgeColor,
						)}
					>
						{p.side} {p.leverage}
					</span>
				</div>
				<span className={cn('font-medium', sentimentColor(p.pnlValue))}>
					{p.roi}
				</span>
			</div>

			<div className="mt-2 grid grid-cols-2 gap-y-1.5 text-muted-foreground">
				<div>
					<span>Entry</span>
					<div className="text-foreground">{p.entryPrice}</div>
				</div>
				<div className="text-right">
					<span>Mark</span>
					<div className="text-foreground">{p.markPrice}</div>
				</div>
				<div>
					<span>Size</span>
					<div className="text-foreground">{p.positionValue}</div>
				</div>
				<div className="text-right">
					<span>PnL</span>
					<div className={sentimentColor(p.pnlValue)}>{p.pnl}</div>
				</div>
				<div>
					<span>Liq Price</span>
					<div className="text-foreground">{p.liquidationPrice}</div>
				</div>
				{(p.tp || p.sl) && (
					<div className="text-right">
						<span>TP/SL</span>
						<div className="text-foreground">
							{p.tp ?? '--'} / {p.sl ?? '--'}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
