import { useState, useCallback } from 'react';
import { Wallet, ClipboardList } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { EmptyState } from '../components/empty-state';
import { useOrdersData, type FormattedOrder } from './hooks/use-orders-data';
import { useOrderActions } from './hooks/use-order-actions';
import { OrdersTable } from './orders-table';
import { OrderCard } from './order-card';
import { EditOrderDialog } from './actions/edit-order-dialog';

export function OrdersContent() {
	const { isAuthenticated, login } = useAuth();
	const { orders, isEmpty } = useOrdersData();
	const isDesktop = useMediaQuery('(min-width: 1024px)');
	const { cancelOrder, cancelAllOrders, isProcessing } = useOrderActions();
	const [editOrder, setEditOrder] = useState<FormattedOrder | null>(null);

	const handleEdit = useCallback(
		(order: FormattedOrder) => setEditOrder(order),
		[],
	);

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

	return (
		<>
			{isDesktop ? (
				<OrdersTable
					orders={orders}
					isProcessing={isProcessing}
					onCancel={cancelOrder}
					onCancelAll={cancelAllOrders}
					onEdit={handleEdit}
				/>
			) : (
				<div className="grid gap-2 p-2 sm:grid-cols-2">
					{orders.map((order) => (
						<OrderCard
							key={order.id}
							order={order}
							isProcessing={isProcessing}
							onCancel={cancelOrder}
						/>
					))}
				</div>
			)}
			<EditOrderDialog
				order={editOrder}
				open={editOrder !== null}
				onOpenChange={(open) => {
					if (!open) setEditOrder(null);
				}}
			/>
		</>
	);
}
