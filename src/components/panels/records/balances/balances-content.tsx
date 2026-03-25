import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useBalancesData } from './hooks/use-balances-data';
import { BalancesTable } from './balances-table';
import { BalanceCard } from './balance-card';

export function BalancesContent() {
	const { isAuthenticated, login } = useAuth();
	const { balances, isEmpty } = useBalancesData();
	const isDesktop = useMediaQuery('(min-width: 1024px)');

	if (!isAuthenticated) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3">
				<span className="text-sm text-muted-foreground">
					Connect wallet to view balances
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
				No balances
			</div>
		);
	}

	if (isDesktop) {
		return <BalancesTable balances={balances} />;
	}

	return (
		<div className="grid gap-2 p-2 sm:grid-cols-2">
			{balances.map((b) => (
				<BalanceCard key={b.coin} balance={b} />
			))}
		</div>
	);
}
