import { memo, useState, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { cn } from '@/lib/utils';
import { activeNormalizerAtom } from '@/atoms/dex';
import { BUY_BG, SELL_BG } from '@/lib/colors';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
	activePositionActionAtom,
	skipReverseConfirmAtom,
	isClosingPositionAtom,
} from '../atoms/position-actions-atoms';

interface ReverseDialogProps {
	onConfirm: () => void;
}

export const ReverseDialog = memo(function ReverseDialog({
	onConfirm,
}: ReverseDialogProps) {
	const action = useAtomValue(activePositionActionAtom);
	const setAction = useSetAtom(activePositionActionAtom);
	const isClosing = useAtomValue(isClosingPositionAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);
	const setSkipConfirm = useSetAtom(skipReverseConfirmAtom);

	const open = action?.type === 'reverse';
	const coin = action?.coin ?? '';
	const side = action?.side ?? 'LONG';
	const size = action?.size ?? 0;

	const [skipChecked, setSkipChecked] = useState(false);

	const newSide = side === 'LONG' ? 'Short' : 'Long';
	const oldSide = side === 'LONG' ? 'Long' : 'Short';
	const isBuying = side === 'SHORT';

	const handleConfirm = useCallback(() => {
		if (skipChecked) setSkipConfirm(true);
		onConfirm();
	}, [skipChecked, setSkipConfirm, onConfirm]);

	const estLiqPrice =
		normalizer.estimateLiquidationPrice && action
			? normalizer.estimateLiquidationPrice({
					side: isBuying ? 'long' : 'short',
					entryPrice: action.markPrice,
					leverage: parseFloat(action.leverage) || 20,
					sizeInCoin: size,
				})
			: 0;

	return (
		<Dialog open={open} onOpenChange={() => setAction(null)}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Reverse Position</DialogTitle>
				</DialogHeader>

				<div className="space-y-1 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Action</span>
						<span className="text-primary">
							{oldSide} → {newSide}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Size</span>
						<span className="text-primary">
							{normalizer.formatSize(size, coin)} {coin}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Price</span>
						<span className="text-foreground">Market</span>
					</div>
					{estLiqPrice > 0 && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">
								Est. Liquidation Price
							</span>
							<span className="text-foreground">
								{normalizer.formatPrice(estLiqPrice, coin, {
									hasDollarSign: false,
								})}
							</span>
						</div>
					)}
				</div>

				<label className="flex cursor-pointer items-center gap-2 text-xs">
					<Checkbox
						checked={skipChecked}
						onCheckedChange={(checked) => setSkipChecked(checked === true)}
					/>
					<span className="text-muted-foreground">Don't show this again</span>
				</label>

				<DialogFooter>
					<Button
						className={cn('w-full', isBuying ? BUY_BG : SELL_BG)}
						disabled={isClosing}
						onClick={handleConfirm}
					>
						{isClosing
							? 'Reversing...'
							: `${isBuying ? 'Buy / Long' : 'Sell / Short'}`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});
