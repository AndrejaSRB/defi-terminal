import { memo, useState, useCallback, useEffect } from 'react';
import { useAtomValue, useStore } from 'jotai';
import { toast } from 'sonner';
import { activeDexExchangeAtom, activeNormalizerAtom } from '@/atoms/dex';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { tradingWs } from '@/services/ws';
import { safeParseFloat } from '@/lib/numbers';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import type { FormattedOrder } from '../hooks/use-orders-data';

interface EditOrderDialogProps {
	order: FormattedOrder | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const EditOrderDialog = memo(function EditOrderDialog({
	order,
	open,
	onOpenChange,
}: EditOrderDialogProps) {
	const store = useStore();
	const normalizer = useAtomValue(activeNormalizerAtom);
	const [price, setPrice] = useState('');
	const [size, setSize] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (open && order) {
			setPrice(order.rawPrice.toString());
			setSize(order.rawSize.toString());
		}
	}, [open, order]);

	const coin = order?.coin ?? '';
	const priceDecimals =
		order && normalizer
			? normalizer.calculatePriceDecimals(order.rawPrice, coin)
			: 2;

	const handleConfirm = useCallback(async () => {
		if (!order || isSubmitting) return;
		setIsSubmitting(true);

		const address = store.get(walletAddressAtom) ?? '';
		store.get(activeDexExchangeAtom).setWalletAddress(address);

		try {
			const exchange = store.get(activeDexExchangeAtom);
			await exchange.modifyOrder(
				{
					coin,
					orderId: order.rawOrderId,
					price: safeParseFloat(price),
					size: safeParseFloat(size),
					reduceOnly: order.reduceOnly === 'Yes',
				},
				tradingWs,
			);
			toast.success('Order modified');
			onOpenChange(false);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Modify order failed',
			);
		} finally {
			setIsSubmitting(false);
		}
	}, [order, price, size, coin, isSubmitting, store, onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Edit Order</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					<div className="space-y-1">
						<span className="text-xs text-muted-foreground">Price</span>
						<NumberInput
							value={price}
							onValueChange={setPrice}
							prefix="$"
							maxDecimals={priceDecimals}
						/>
					</div>
					<div className="space-y-1">
						<span className="text-xs text-muted-foreground">Size</span>
						<NumberInput
							value={size}
							onValueChange={setSize}
							suffix={order?.displayName ?? ''}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						className="w-full"
						disabled={isSubmitting}
						onClick={handleConfirm}
					>
						{isSubmitting ? 'Modifying...' : 'Confirm'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});
