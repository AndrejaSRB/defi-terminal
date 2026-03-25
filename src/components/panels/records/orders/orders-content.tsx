import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useOrdersData } from './hooks/use-orders-data';
import { OrdersTable } from './orders-table';
import { OrderCard } from './order-card';

export function OrdersContent() {
	const { isAuthenticated, login } = useAuth();
	const { orders, isEmpty } = useOrdersData();
	const isDesktop = useMediaQuery('(min-width: 1024px)');
	const setActiveToken = useSetAtom(activeTokenAtom);

	const selectToken = useCallback(
		(coin: string) => setActiveToken(coin),
		[setActiveToken],
	);

	if (!isAuthenticated) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3">
				<span className="text-sm text-muted-foreground">
					Connect wallet to view orders
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
				No open orders
			</div>
		);
	}

	if (isDesktop) {
		return <OrdersTable orders={orders} onSelectToken={selectToken} />;
	}

	return (
		<div className="grid gap-2 p-2 sm:grid-cols-2">
			{orders.map((o) => (
				<OrderCard key={o.id} order={o} onSelectToken={selectToken} />
			))}
		</div>
	);
}
