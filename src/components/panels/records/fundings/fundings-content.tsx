import { Wallet, Percent } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { EmptyState } from '../components/empty-state';
import { useFundingsData } from './hooks/use-fundings-data';
import { FundingsTable } from './fundings-table';
import { FundingCard } from './funding-card';

export function FundingsContent() {
	const { isAuthenticated, login } = useAuth();
	const { fundings, isEmpty } = useFundingsData();
	const isDesktop = useMediaQuery('(min-width: 1024px)');

	if (!isAuthenticated) {
		return (
			<EmptyState
				icon={<Wallet className="size-5" />}
				title="Connect Wallet"
				description="Connect your wallet to view funding history"
				action={{ label: 'Connect', onClick: login }}
			/>
		);
	}

	if (isEmpty) {
		return (
			<EmptyState
				icon={<Percent className="size-5" />}
				title="No Funding History"
				description="Funding payments will appear here"
			/>
		);
	}

	if (isDesktop) {
		return <FundingsTable fundings={fundings} />;
	}

	return (
		<div className="grid gap-2 p-2 sm:grid-cols-2">
			{fundings.map((funding) => (
				<FundingCard key={funding.id} funding={funding} />
			))}
		</div>
	);
}
