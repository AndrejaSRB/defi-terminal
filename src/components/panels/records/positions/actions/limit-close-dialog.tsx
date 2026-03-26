import { memo, useState, useCallback, useEffect } from 'react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { toast } from 'sonner';
import { activeDexExchangeAtom } from '@/atoms/dex';
import { pricesAtom } from '@/atoms/prices';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { tradingWs } from '@/services/ws';
import { setActiveWalletAddress } from '@/normalizer/hyperliquid/exchange';
import { safeParseFloat } from '@/lib/numbers';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import { Slider } from '@/components/ui/slider';
import {
	activePositionActionAtom,
	isClosingPositionAtom,
} from '../atoms/position-actions-atoms';

export const LimitCloseDialog = memo(function LimitCloseDialog() {
	const store = useStore();
	const action = useAtomValue(activePositionActionAtom);
	const setAction = useSetAtom(activePositionActionAtom);
	const setIsClosing = useSetAtom(isClosingPositionAtom);
	const isClosing = useAtomValue(isClosingPositionAtom);

	const open = action?.type === 'limit';
	const coin = action?.coin ?? '';
	const side = action?.side ?? 'LONG';
	const fullSize = action?.size ?? 0;

	const [price, setPrice] = useState('');
	const [percent, setPercent] = useState(100);

	useEffect(() => {
		if (open && coin) {
			const prices = store.get(pricesAtom);
			const mid = prices[coin];
			setPrice(mid ?? '');
			setPercent(100);
		}
	}, [open, coin, store]);

	const handleSlider = useCallback((values: number[]) => {
		setPercent(values[0]);
	}, []);

	const fillMid = useCallback(() => {
		const prices = store.get(pricesAtom);
		setPrice(prices[coin] ?? '');
	}, [store, coin]);

	const size = (fullSize * percent) / 100;
	const sizeUsd = size * safeParseFloat(price);

	const handleConfirm = useCallback(async () => {
		if (isClosing || !action) return;
		setIsClosing(true);

		const address = store.get(walletAddressAtom) ?? '';
		setActiveWalletAddress(address);

		try {
			const exchange = store.get(activeDexExchangeAtom);
			const closeSide = side === 'LONG' ? 'sell' : 'buy';

			const result = await exchange.placeOrder(
				{
					coin,
					side: closeSide as 'buy' | 'sell',
					type: 'limit',
					price: safeParseFloat(price),
					size,
					reduceOnly: true,
					tif: 'Gtc',
				},
				tradingWs,
			);

			if (result.status === 'success') {
				toast.success('Limit close order placed');
				setAction(null);
			} else {
				toast.error(result.message ?? 'Order failed');
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Limit close failed',
			);
		} finally {
			setIsClosing(false);
		}
	}, [
		isClosing,
		action,
		store,
		side,
		coin,
		price,
		size,
		setIsClosing,
		setAction,
	]);

	return (
		<Dialog open={open} onOpenChange={() => setAction(null)}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Limit Close</DialogTitle>
					<DialogDescription>
						This will send an order to close your position at the limit price.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3">
					<NumberInput
						value={price}
						onValueChange={setPrice}
						prefix="Price (USDC)"
						suffix={
							<button
								type="button"
								onClick={fillMid}
								className="text-primary text-[11px] hover:text-primary/80"
							>
								Mid
							</button>
						}
					/>

					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>Size</span>
						<span className="text-foreground">
							{sizeUsd > 0
								? `${sizeUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC`
								: '--'}
						</span>
					</div>

					<Slider
						min={0}
						max={100}
						step={1}
						value={[percent]}
						onValueChange={handleSlider}
					/>
				</div>

				<DialogFooter>
					<Button
						className="w-full"
						disabled={isClosing || safeParseFloat(price) <= 0}
						onClick={handleConfirm}
					>
						{isClosing ? 'Confirming...' : 'Confirm'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});
