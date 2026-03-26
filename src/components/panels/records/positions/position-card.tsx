import { cn } from '@/lib/utils';
import { sentimentColor } from '@/lib/colors';
import { CoinLink } from '../components/coin-link';
import { PositionActionButtons } from './actions/position-action-buttons';
import type { FormattedPosition } from './hooks/use-positions-data';

interface PositionCardProps {
	position: FormattedPosition;
	isClosing: boolean;
	onLimitClose: (position: FormattedPosition) => void;
	onMarketClose: (position: FormattedPosition) => void;
	onReverse: (position: FormattedPosition) => void;
}

export function PositionCard({
	position,
	isClosing,
	onLimitClose,
	onMarketClose,
	onReverse,
}: PositionCardProps) {
	const isLong = position.side === 'LONG';
	const badgeColor = isLong
		? 'text-green-400 bg-green-400/10'
		: 'text-red-400 bg-red-400/10';

	return (
		<div className="rounded-md border border-border bg-card p-3 text-xs">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5">
					<CoinLink
						coin={position.coin}
						displayName={position.displayName}
						dexName={position.dexName}
					/>
					<span
						className={cn(
							'rounded px-1 py-px text-[10px] font-medium',
							badgeColor,
						)}
					>
						{position.side} {position.leverage}
					</span>
				</div>
				<span className={cn('font-medium', sentimentColor(position.pnlValue))}>
					{position.roi}
				</span>
			</div>

			<div className="mt-2 grid grid-cols-2 gap-y-1.5 text-muted-foreground">
				<div>
					<span>Entry</span>
					<div className="text-foreground">{position.entryPrice}</div>
				</div>
				<div className="text-right">
					<span>Mark</span>
					<div className="text-foreground">{position.markPrice}</div>
				</div>
				<div>
					<span>Size</span>
					<div className="text-foreground">{position.positionValue}</div>
				</div>
				<div className="text-right">
					<span>PnL</span>
					<div className={sentimentColor(position.pnlValue)}>
						{position.pnl}
					</div>
				</div>
				<div>
					<span>Liq Price</span>
					<div className="text-foreground">{position.liquidationPrice}</div>
				</div>
				{(position.tp || position.sl) && (
					<div className="text-right">
						<span>TP/SL</span>
						<div className="text-foreground">
							{position.tp ?? '--'} / {position.sl ?? '--'}
						</div>
					</div>
				)}
			</div>

			<div className="mt-2 border-t border-border pt-2">
				<PositionActionButtons
					position={position}
					onLimitClose={onLimitClose}
					onMarketClose={onMarketClose}
					onReverse={onReverse}
					disabled={isClosing}
				/>
			</div>
		</div>
	);
}
