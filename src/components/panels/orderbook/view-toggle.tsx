import { cn } from '@/lib/utils';
import type { OrderBookView } from './hooks/use-orderbook-view';

interface ViewToggleProps {
	view: OrderBookView;
	onChange: (view: OrderBookView) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
	const base =
		'flex h-4 w-4 flex-col gap-px rounded-sm p-0.5 transition-opacity';

	return (
		<div className="flex items-center gap-1">
			<button
				type="button"
				onClick={() => onChange('both')}
				className={cn(
					base,
					view === 'both' ? 'opacity-100' : 'opacity-40 hover:opacity-70',
				)}
				title="Both"
			>
				<div className="flex-1 rounded-[1px] bg-red-400" />
				<div className="flex-1 rounded-[1px] bg-green-400" />
			</button>

			<button
				type="button"
				onClick={() => onChange('asks')}
				className={cn(
					base,
					view === 'asks' ? 'opacity-100' : 'opacity-40 hover:opacity-70',
				)}
				title="Asks only"
			>
				<div className="flex-1 rounded-[1px] bg-red-400" />
				<div className="flex-1 rounded-[1px] bg-muted-foreground/20" />
			</button>

			<button
				type="button"
				onClick={() => onChange('bids')}
				className={cn(
					base,
					view === 'bids' ? 'opacity-100' : 'opacity-40 hover:opacity-70',
				)}
				title="Bids only"
			>
				<div className="flex-1 rounded-[1px] bg-muted-foreground/20" />
				<div className="flex-1 rounded-[1px] bg-green-400" />
			</button>
		</div>
	);
}
