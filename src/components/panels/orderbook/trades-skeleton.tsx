import { Skeleton } from '@/components/ui/skeleton';

function SkeletonRow() {
	return (
		<div className="grid grid-cols-3 px-2 py-1">
			<Skeleton className="h-3 w-14" />
			<Skeleton className="mx-auto h-3 w-12" />
			<Skeleton className="ml-auto h-3 w-16" />
		</div>
	);
}

export function TradesSkeleton({ rows = 20 }: { rows?: number }) {
	return (
		<div className="flex h-full flex-col">
			<div className="grid grid-cols-3 px-2 py-1 text-[11px] text-muted-foreground">
				<span>Price</span>
				<span className="text-center">Size</span>
				<span className="text-right">Time</span>
			</div>

			<div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
				{Array.from({ length: rows }).map((_, i) => (
					<SkeletonRow key={i} />
				))}
			</div>
		</div>
	);
}
