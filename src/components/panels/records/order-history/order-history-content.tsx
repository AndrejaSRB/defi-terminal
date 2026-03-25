import { Wallet, History } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { EmptyState } from '../components/empty-state';
import { useOrderHistoryData } from './hooks/use-order-history-data';
import { OrderHistoryTable } from './order-history-table';
import { OrderHistoryCard } from './order-history-card';

export function OrderHistoryContent() {
	const { isAuthenticated, login } = useAuth();
	const { orders, isEmpty } = useOrderHistoryData();
	const isDesktop = useMediaQuery('(min-width: 1024px)');

	if (!isAuthenticated) {
		return (
			<EmptyState
				icon={<Wallet className="size-5" />}
				title="Connect Wallet"
				description="Connect your wallet to view order history"
				action={{ label: 'Connect', onClick: login }}
			/>
		);
	}

	if (isEmpty) {
		return (
			<EmptyState
				icon={<History className="size-5" />}
				title="No Order History"
				description="Your past orders will appear here"
			/>
		);
	}

	if (isDesktop) {
		return <OrderHistoryTable orders={orders} />;
	}

	return (
		<div className="grid gap-2 p-2 sm:grid-cols-2">
			{orders.map((order) => (
				<OrderHistoryCard key={`${order.id}-${order.status}`} order={order} />
			))}
		</div>
	);
}
