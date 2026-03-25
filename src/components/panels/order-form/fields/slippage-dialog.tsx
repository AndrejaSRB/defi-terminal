import { memo, useState, useCallback, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
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
import { slippageAtom } from '../atoms/order-form-atoms';

const MAX_SLIPPAGE = 8;

interface SlippageDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const SlippageDialog = memo(function SlippageDialog({
	open,
	onOpenChange,
}: SlippageDialogProps) {
	const currentSlippage = useAtomValue(slippageAtom);
	const setSlippage = useSetAtom(slippageAtom);

	const [localValue, setLocalValue] = useState(currentSlippage);
	const [inputValue, setInputValue] = useState(currentSlippage.toString());

	useEffect(() => {
		if (open) {
			setLocalValue(currentSlippage);
			setInputValue(currentSlippage.toString());
		}
	}, [open, currentSlippage]);

	const handleSliderChange = useCallback((values: number[]) => {
		const num = values[0];
		setLocalValue(num);
		setInputValue(num.toFixed(1));
	}, []);

	const handleInputChange = useCallback((raw: string) => {
		setInputValue(raw);
		const num = Number(raw);
		if (num >= 0 && num <= MAX_SLIPPAGE) {
			setLocalValue(num);
		}
	}, []);

	const handleConfirm = useCallback(() => {
		setSlippage(localValue);
		onOpenChange(false);
	}, [localValue, setSlippage, onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Max Slippage</DialogTitle>
					<DialogDescription>
						Set the maximum slippage tolerance for market orders.
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-center gap-3">
					<Slider
						min={0}
						max={MAX_SLIPPAGE}
						step={0.1}
						value={[localValue]}
						onValueChange={handleSliderChange}
						className="flex-1"
					/>
					<NumberInput
						value={inputValue}
						onValueChange={handleInputChange}
						suffix="%"
						maxDecimals={1}
						className="w-20"
					/>
				</div>

				<p className="text-xs text-muted-foreground">Max: {MAX_SLIPPAGE}%</p>

				<DialogFooter>
					<Button className="w-full" onClick={handleConfirm}>
						Confirm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});
