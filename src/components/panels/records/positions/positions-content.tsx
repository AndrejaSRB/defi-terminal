import { Wallet, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { EmptyState } from '../components/empty-state';
import { usePositionsData } from './hooks/use-positions-data';
import { usePositionActions } from './hooks/use-position-actions';
import { PositionsTable } from './positions-table';
import { PositionCard } from './position-card';
import { LimitCloseDialog } from './actions/limit-close-dialog';
import { MarketCloseDialog } from './actions/market-close-dialog';
import { TpslEditDialog } from './actions/tpsl-edit-dialog';
import { ReverseDialog } from './actions/reverse-dialog';

export function PositionsContent() {
	const { isAuthenticated, login } = useAuth();
	const { positions, isEmpty } = usePositionsData();
	const isDesktop = useMediaQuery('(min-width: 1024px)');
	const {
		openLimitClose,
		openMarketClose,
		reversePosition,
		executeReverse,
		closeAllPositions,
		openTpslEdit,
		isClosing,
	} = usePositionActions();

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

	return (
		<>
			{isDesktop ? (
				<PositionsTable
					positions={positions}
					isClosing={isClosing}
					onLimitClose={openLimitClose}
					onMarketClose={openMarketClose}
					onReverse={reversePosition}
					onCloseAll={closeAllPositions}
					onTpslEdit={openTpslEdit}
				/>
			) : (
				<div className="grid gap-2 p-2 sm:grid-cols-2">
					{positions.map((position) => (
						<PositionCard
							key={position.coin}
							position={position}
							isClosing={isClosing}
							onLimitClose={openLimitClose}
							onMarketClose={openMarketClose}
							onReverse={reversePosition}
						/>
					))}
				</div>
			)}
			<LimitCloseDialog />
			<MarketCloseDialog />
			<TpslEditDialog />
			<ReverseDialog onConfirm={executeReverse} />
		</>
	);
}
