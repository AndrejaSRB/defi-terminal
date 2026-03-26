import { memo, useState, useCallback, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { pricesAtom } from '@/atoms/prices';
import { activeNormalizerAtom } from '@/atoms/dex';
import { safeParseFloat } from '@/lib/numbers';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
	activePositionActionAtom,
	skipMarketCloseConfirmAtom,
	isClosingPositionAtom,
} from '../atoms/position-actions-atoms';
import { usePositionActions } from '../hooks/use-position-actions';

export const MarketCloseDialog = memo(function MarketCloseDialog() {
	const action = useAtomValue(activePositionActionAtom);
	const setAction = useSetAtom(activePositionActionAtom);
	const isClosing = useAtomValue(isClosingPositionAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);
	const setSkipConfirm = useSetAtom(skipMarketCloseConfirmAtom);
	const { executeMarketClose } = usePositionActions();

	const open = action?.type === 'market';
	const coin = action?.coin ?? '';
	const fullSize = action?.size ?? 0;

	const [percent, setPercent] = useState(100);
	const [skipChecked, setSkipChecked] = useState(false);

	useEffect(() => {
		if (open) {
			setPercent(100);
			setSkipChecked(false);
		}
	}, [open]);

	const handleSlider = useCallback((values: number[]) => {
		setPercent(values[0]);
	}, []);

	const size = (fullSize * percent) / 100;
	const prices = useAtomValue(pricesAtom);
	const markPrice = safeParseFloat(prices[coin]);
	const sizeUsd = size * markPrice;

	const handleConfirm = useCallback(async () => {
		if (!action) return;
		if (skipChecked) setSkipConfirm(true);

		await executeMarketClose({
			...action,
			size,
		});
	}, [action, size, skipChecked, setSkipConfirm, executeMarketClose]);

	return (
		<Dialog open={open} onOpenChange={() => setAction(null)}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Market Close</DialogTitle>
					<DialogDescription>
						This will attempt to immediately close the position.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3">
					<div className="space-y-1 text-xs">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Size</span>
							<span className="text-primary">
								{normalizer.formatSize(fullSize, coin)} {coin}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Price</span>
							<span className="text-foreground">Market</span>
						</div>
					</div>

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

					<label className="flex cursor-pointer items-center gap-2 text-xs">
						<Checkbox
							checked={skipChecked}
							onCheckedChange={(checked) => setSkipChecked(checked === true)}
						/>
						<span className="text-muted-foreground">Don't show this again</span>
					</label>
				</div>

				<DialogFooter>
					<Button
						className="w-full"
						disabled={isClosing}
						onClick={handleConfirm}
					>
						{isClosing ? 'Closing...' : 'Market Close'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});
