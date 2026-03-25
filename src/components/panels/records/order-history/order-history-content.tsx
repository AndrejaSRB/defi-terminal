import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useOrderHistoryData } from './hooks/use-order-history-data';
import { OrderHistoryTable } from './order-history-table';
import { OrderHistoryCard } from './order-history-card';

export function OrderHistoryContent() {
	const { isAuthenticated, login } = useAuth();
	const { orders, isEmpty } = useOrderHistoryData();
	const isDesktop = useMediaQuery('(min-width: 1024px)');

	if (!isAuthenticated) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3">
				<span className="text-sm text-muted-foreground">
					Connect wallet to view order history
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
				No order history
			</div>
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
