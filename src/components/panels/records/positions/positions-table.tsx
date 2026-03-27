import { cn } from '@/lib/utils';
import { sentimentColor } from '@/lib/colors';
import { CoinLink } from '../components/coin-link';
import { PositionActionButtons } from './actions/position-action-buttons';
import { CloseAllDialog } from './actions/close-all-dialog';
import type { FormattedPosition } from './hooks/use-positions-data';

const COLUMNS = [
	'Token',
	'Size',
	'Position Value',
	'Entry Price',
	'Mark Price',
	'PnL (ROI%)',
	'Liq Price',
	'Margin',
	'Funding',
] as const;

interface PositionsTableProps {
	positions: FormattedPosition[];
	isClosing: boolean;
	onLimitClose: (position: FormattedPosition) => void;
	onMarketClose: (position: FormattedPosition) => void;
	onReverse: (position: FormattedPosition) => void;
	onCloseAll: () => void;
	onTpslEdit: (position: FormattedPosition) => void;
}

export function PositionsTable({
	positions,
	isClosing,
	onLimitClose,
	onMarketClose,
	onReverse,
	onCloseAll,
	onTpslEdit,
}: PositionsTableProps) {
	return (
		<div className="relative h-full overflow-x-auto no-scrollbar">
			<table className="w-full min-w-[1050px] text-xs">
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
							{positions.length > 0 ? (
								<CloseAllDialog onConfirm={onCloseAll} isClosing={isClosing} />
							) : (
								<span className="text-muted-foreground font-medium">
									Actions
								</span>
							)}
						</th>
						<th className="whitespace-nowrap px-2 py-1.5 text-left font-medium text-muted-foreground">
							TP/SL
						</th>
					</tr>
				</thead>
				<tbody>
					{positions.map((position) => {
						const isLong = position.side === 'LONG';
						const badgeColor = isLong
							? 'text-green-400 bg-green-400/10'
							: 'text-red-400 bg-red-400/10';

						return (
							<tr
								key={position.coin}
								className="border-b border-border/50 hover:bg-muted/30"
							>
								<td className="whitespace-nowrap px-2 py-1.5">
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
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{position.size}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{position.positionValue}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{position.entryPrice}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{position.markPrice}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									<span
										className={cn(
											'inline-block min-w-[120px]',
											sentimentColor(position.pnlValue),
										)}
									>
										{position.pnl} ({position.roi})
									</span>
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{position.liquidationPrice}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{position.marginUsed}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									{position.funding}
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									<PositionActionButtons
										position={position}
										onLimitClose={onLimitClose}
										onMarketClose={onMarketClose}
										onReverse={onReverse}
										disabled={isClosing}
									/>
								</td>
								<td className="whitespace-nowrap px-2 py-1.5">
									<div className="flex items-center gap-1">
										<span>
											{position.tp ?? '--'} / {position.sl ?? '--'}
										</span>
										<button
											type="button"
											onClick={() => onTpslEdit(position)}
											className="text-muted-foreground transition-colors hover:text-foreground"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="12"
												height="12"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
											</svg>
										</button>
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
