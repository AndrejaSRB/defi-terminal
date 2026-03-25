import { Skeleton } from '@/components/ui/skeleton';

export function OrderFormSkeleton() {
	return (
		<div className="flex h-full flex-col gap-3 p-3">
			<div className="flex gap-2">
				<Skeleton className="h-6 flex-1 rounded-md" />
				<Skeleton className="h-6 flex-1 rounded-md" />
			</div>
			<Skeleton className="h-7 rounded-md" />
			<Skeleton className="h-8 rounded-md" />
			<div className="space-y-1">
				<Skeleton className="h-3 w-24 rounded" />
				<Skeleton className="h-3 w-32 rounded" />
			</div>
			<Skeleton className="h-8 rounded-md" />
			<Skeleton className="h-5 rounded-full" />
			<Skeleton className="h-4 w-28 rounded" />
			<Skeleton className="h-4 w-36 rounded" />
			<div className="flex-1" />
			<Skeleton className="h-9 rounded-lg" />
			<div className="space-y-1">
				<Skeleton className="h-3 rounded" />
				<Skeleton className="h-3 rounded" />
				<Skeleton className="h-3 rounded" />
			</div>
		</div>
	);
}
