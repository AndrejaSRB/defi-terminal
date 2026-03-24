import { Skeleton } from '@/components/ui/skeleton';

export function ChartSkeleton() {
	return (
		<div className="flex h-full flex-col gap-2 p-3">
			<div className="flex gap-2">
				<Skeleton className="h-6 w-12" />
				<Skeleton className="h-6 w-12" />
				<Skeleton className="h-6 w-12" />
				<Skeleton className="h-6 w-12" />
			</div>
			<Skeleton className="h-4 w-48" />
			<Skeleton className="flex-1 w-full" />
		</div>
	);
}
