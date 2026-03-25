import { Wallet, Coins } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { EmptyState } from '../components/empty-state';
import { useBalancesData } from './hooks/use-balances-data';
import { BalancesTable } from './balances-table';
import { BalanceCard } from './balance-card';

export function BalancesContent() {
	const { isAuthenticated, login } = useAuth();
	const { balances, isEmpty } = useBalancesData();
	const isDesktop = useMediaQuery('(min-width: 1024px)');

	if (!isAuthenticated) {
		return (
			<EmptyState
				icon={<Wallet className="size-5" />}
				title="Connect Wallet"
				description="Connect your wallet to view balances"
				action={{ label: 'Connect', onClick: login }}
			/>
		);
	}

	if (isEmpty) {
		return (
			<EmptyState
				icon={<Coins className="size-5" />}
				title="No Balances"
				description="Deposit funds to start trading"
			/>
		);
	}

	if (isDesktop) {
		return <BalancesTable balances={balances} />;
	}

	return (
		<div className="grid gap-2 p-2 sm:grid-cols-2">
			{balances.map((balance) => (
				<BalanceCard key={balance.coin} balance={balance} />
			))}
		</div>
	);
}
