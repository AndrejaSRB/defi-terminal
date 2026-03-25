import { Wallet, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { EmptyState } from '../components/empty-state';
import { useFillsData } from './hooks/use-fills-data';
import { FillsTable } from './fills-table';
import { FillCard } from './fill-card';

export function FillsContent() {
	const { isAuthenticated, login } = useAuth();
	const { fills, isEmpty } = useFillsData();
	const isDesktop = useMediaQuery('(min-width: 1024px)');

	if (!isAuthenticated) {
		return (
			<EmptyState
				icon={<Wallet className="size-5" />}
				title="Connect Wallet"
				description="Connect your wallet to view trade history"
				action={{ label: 'Connect', onClick: login }}
			/>
		);
	}

	if (isEmpty) {
		return (
			<EmptyState
				icon={<ArrowLeftRight className="size-5" />}
				title="No Trade History"
				description="Your executed trades will appear here"
			/>
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
