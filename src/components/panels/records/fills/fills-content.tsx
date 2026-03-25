import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useFillsData } from './hooks/use-fills-data';
import { FillsTable } from './fills-table';
import { FillCard } from './fill-card';

export function FillsContent() {
	const { isAuthenticated, login } = useAuth();
	const { fills, isEmpty } = useFillsData();
	const isDesktop = useMediaQuery('(min-width: 1024px)');

	if (!isAuthenticated) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3">
				<span className="text-sm text-muted-foreground">
					Connect wallet to view trade history
				</span>
				<Button size="sm" onClick={login}>
					Connect
				</Button>
			</div>
		);
	}

	if (isEmpty) {
		return (
			<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
				No trade history
			</div>
		);
	}

	if (isDesktop) {
		return <FillsTable fills={fills} />;
	}

	return (
		<div className="grid gap-2 p-2 sm:grid-cols-2">
			{fills.map((fill) => (
				<FillCard key={fill.id} fill={fill} />
			))}
		</div>
	);
}
