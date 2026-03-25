import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { usePositionsData } from './hooks/use-positions-data';
import { PositionsTable } from './positions-table';
import { PositionCard } from './position-card';

export function PositionsContent() {
	const { isAuthenticated, login } = useAuth();
	const { positions, isEmpty } = usePositionsData();
	const isDesktop = useMediaQuery('(min-width: 1024px)');

	if (!isAuthenticated) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3">
				<span className="text-sm text-muted-foreground">
					Connect wallet to view positions
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
				No open positions
			</div>
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
