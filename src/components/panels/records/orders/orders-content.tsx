import { Wallet, ClipboardList } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { EmptyState } from '../components/empty-state';
import { useOrdersData } from './hooks/use-orders-data';
import { OrdersTable } from './orders-table';
import { OrderCard } from './order-card';

export function OrdersContent() {
	const { isAuthenticated, login } = useAuth();
	const { orders, isEmpty } = useOrdersData();
	const isDesktop = useMediaQuery('(min-width: 1024px)');

	if (!isAuthenticated) {
		return (
			<EmptyState
				icon={<Wallet className="size-5" />}
				title="Connect Wallet"
				description="Connect your wallet to view orders"
				action={{ label: 'Connect', onClick: login }}
			/>
		);
	}

	if (isEmpty) {
		return (
			<EmptyState
				icon={<ClipboardList className="size-5" />}
				title="No Open Orders"
				description="Place a limit order to see it here"
			/>
		);
	}

	if (isDesktop) {
		return <OrdersTable orders={orders} />;
	}

	return (
		<div className="grid gap-2 p-2 sm:grid-cols-2">
			{orders.map((order) => (
				<OrderCard key={order.id} order={order} />
			))}
		</div>
	);
}
