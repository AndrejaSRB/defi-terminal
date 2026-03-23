import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useOrderbookData } from './hooks/use-orderbook-data';
import { useOrderbookView } from './hooks/use-orderbook-view';
import { AggDropdown } from './agg-dropdown';
import { DenomDropdown } from './denom-dropdown';
import { ViewToggle } from './view-toggle';
import { OrderBookRow } from './orderbook-row';
import { OrderBookSkeleton } from './orderbook-skeleton';

function useVisibleRows(ref: React.RefObject<HTMLDivElement | null>) {
	const [count, setCount] = useState(20);

	const measure = useCallback(() => {
		if (!ref.current) return;
		const containerHeight = ref.current.clientHeight;
		const firstRow = ref.current.querySelector('[data-ob-row]');
		const rowHeight = firstRow ? firstRow.getBoundingClientRect().height : 22;
		if (rowHeight > 0) {
			setCount(Math.floor(containerHeight / rowHeight));
		}
	}, [ref]);

	useEffect(() => {
		measure();
		const observer = new ResizeObserver(measure);
		if (ref.current) observer.observe(ref.current);
		return () => observer.disconnect();
	}, [measure, ref]);

	return count;
}

export function OrderBookContent() {
	const { asks, bids, spread, isLoading } = useOrderbookData();
	const { view, setView } = useOrderbookView();
	const asksRef = useRef<HTMLDivElement>(null);
	const bidsRef = useRef<HTMLDivElement>(null);
	const asksVisible = useVisibleRows(asksRef);
	const bidsVisible = useVisibleRows(bidsRef);

	if (isLoading) {
		return <OrderBookSkeleton />;
	}

	const showAsks = view === 'both' || view === 'asks';
	const showBids = view === 'both' || view === 'bids';
	const isBothView = view === 'both';

	const visibleAsks = asks.slice(-asksVisible);
	const visibleBids = bids.slice(0, bidsVisible);

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-1 py-0.5">
				<div className="flex items-center gap-1.5">
					<AggDropdown />
					<ViewToggle view={view} onChange={setView} />
				</div>
				<DenomDropdown />
			</div>

			<div className="grid grid-cols-3 px-2 py-1 text-[11px] text-muted-foreground">
				<span>Price</span>
				<span className="text-center">Size</span>
				<span className="text-right">Total</span>
			</div>

			{showAsks && (
				<div
					ref={asksRef}
					className={cn(
						'flex-1 overflow-hidden',
						isBothView && 'flex flex-col justify-end',
					)}
				>
					{visibleAsks.map((level) => (
						<OrderBookRow key={level.rawPrice} level={level} />
					))}
				</div>
			)}

			<div className="grid grid-cols-3 border-y border-border px-2 py-0.5 text-[11px] text-muted-foreground">
				<span>Spread</span>
				<span className="text-center">{spread.value}</span>
				<span className="text-right">{spread.percentage}</span>
			</div>

			{showBids && (
				<div ref={bidsRef} className="flex-1 overflow-hidden">
					{visibleBids.map((level) => (
						<OrderBookRow key={level.rawPrice} level={level} />
					))}
				</div>
			)}
		</div>
	);
}
