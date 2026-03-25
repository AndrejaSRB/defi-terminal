import { Wallet, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { EmptyState } from '../components/empty-state';
import { usePositionsData } from './hooks/use-positions-data';
import { PositionsTable } from './positions-table';
import { PositionCard } from './position-card';

export function PositionsContent() {
	const { isAuthenticated, login } = useAuth();
	const { positions, isEmpty } = usePositionsData();
	const isDesktop = useMediaQuery('(min-width: 1024px)');

	if (!isAuthenticated) {
		return (
			<EmptyState
				icon={<Wallet className="size-5" />}
				title="Connect Wallet"
				description="Connect your wallet to view positions"
				action={{ label: 'Connect', onClick: login }}
			/>
		);
	}

	if (isEmpty) {
		return (
			<EmptyState
				icon={<TrendingUp className="size-5" />}
				title="No Open Positions"
				description="Place a trade to open a position"
			/>
		);
	}

	if (isDesktop) {
		return <PositionsTable positions={positions} />;
	}

	return (
		<div className="grid gap-2 p-2 sm:grid-cols-2">
			{positions.map((position) => (
				<PositionCard key={position.coin} position={position} />
			))}
		</div>
	);
}
