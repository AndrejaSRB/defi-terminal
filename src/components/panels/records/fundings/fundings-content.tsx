import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useFundingsData } from './hooks/use-fundings-data';
import { FundingsTable } from './fundings-table';
import { FundingCard } from './funding-card';

export function FundingsContent() {
	const { isAuthenticated, login } = useAuth();
	const { fundings, isEmpty } = useFundingsData();
	const isDesktop = useMediaQuery('(min-width: 1024px)');

	if (!isAuthenticated) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3">
				<span className="text-sm text-muted-foreground">
					Connect wallet to view funding history
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
				No funding history
			</div>
		);
	}

	if (isDesktop) {
		return <FundingsTable fundings={fundings} />;
	}

	return (
		<div className="grid gap-2 p-2 sm:grid-cols-2">
			{fundings.map((f) => (
				<FundingCard key={f.id} funding={f} />
			))}
		</div>
	);
}
