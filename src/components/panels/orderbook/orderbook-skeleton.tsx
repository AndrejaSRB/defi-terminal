import { Skeleton } from '@/components/ui/skeleton';

function SkeletonRow() {
	return (
		<div className="grid grid-cols-3 px-2 py-1">
			<Skeleton className="h-3 w-16" />
			<Skeleton className="mx-auto h-3 w-14" />
			<Skeleton className="ml-auto h-3 w-16" />
		</div>
	);
}

export function OrderBookSkeleton({ rows = 20 }: { rows?: number }) {
	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-2 py-2">
				<Skeleton className="h-4 w-12" />
				<Skeleton className="h-4 w-12" />
			</div>

			<div className="grid grid-cols-3 px-2 py-1 text-[11px] text-muted-foreground">
				<span>Price</span>
				<span className="text-center">Size</span>
				<span className="text-right">Total</span>
			</div>

			<div className="flex flex-1 flex-col justify-end gap-0.5 overflow-hidden">
				{Array.from({ length: rows }).map((_, i) => (
					<SkeletonRow key={`ask-${i}`} />
				))}
			</div>

			<div className="grid grid-cols-3 border-y border-border px-2 py-1">
				<span className="text-[11px] text-muted-foreground">Spread</span>
				<Skeleton className="mx-auto h-3 w-10" />
				<Skeleton className="ml-auto h-3 w-10" />
			</div>

			<div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
				{Array.from({ length: rows }).map((_, i) => (
					<SkeletonRow key={`bid-${i}`} />
				))}
			</div>
		</div>
	);
}
