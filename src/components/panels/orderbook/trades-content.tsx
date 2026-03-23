import { useTradesData, type FormattedTrade } from './hooks/use-trades-data';
import { sentimentColor } from '@/lib/colors';
import { TradesSkeleton } from './trades-skeleton';

export function TradesContent() {
	const { trades, isLoading } = useTradesData();

	if (isLoading) {
		return <TradesSkeleton />;
	}

	return (
		<div className="flex h-full flex-col">
			<div className="grid grid-cols-3 px-2 py-1 text-[11px] text-muted-foreground">
				<span>Price</span>
				<span className="text-center">Size</span>
				<span className="text-right">Time</span>
			</div>

			<div className="flex-1 overflow-y-auto">
				{trades.map((trade: FormattedTrade) => (
					<div key={trade.id} className="grid grid-cols-3 px-2 py-0.5 text-xs">
						<span className={sentimentColor(trade.side === 'buy' ? 1 : -1)}>
							{trade.price}
						</span>
						<span className="text-center">{trade.size}</span>
						<span className="text-right text-muted-foreground">
							{trade.time}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
