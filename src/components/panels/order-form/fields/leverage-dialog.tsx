import { memo, useState, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeMetaAtom } from '../atoms/order-form-derived';
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

interface LeverageDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	value: number;
	onChange: (leverage: number) => void;
}

export const LeverageDialog = memo(function LeverageDialog({
	open,
	onOpenChange,
	value,
	onChange,
}: LeverageDialogProps) {
	const token = useAtomValue(activeTokenAtom);
	const meta = useAtomValue(activeMetaAtom);
	const maxLeverage = meta?.maxLeverage ?? 50;

	const [localValue, setLocalValue] = useState(value);
	const [inputValue, setInputValue] = useState(value.toString());

	const handleSliderChange = useCallback((values: number[]) => {
		const num = values[0];
		setLocalValue(num);
		setInputValue(num.toString());
	}, []);

	const handleInputChange = useCallback(
		(raw: string) => {
			setInputValue(raw);
			const num = Number(raw);
			if (num >= 1 && num <= maxLeverage) {
				setLocalValue(num);
			}
		},
		[maxLeverage],
	);

	const handleConfirm = useCallback(() => {
		onChange(localValue);
		onOpenChange(false);
	}, [localValue, onChange, onOpenChange]);

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (nextOpen) {
				setLocalValue(value);
				setInputValue(value.toString());
			}
			onOpenChange(nextOpen);
		},
		[value, onOpenChange],
	);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Adjust Leverage</DialogTitle>
					<DialogDescription>
						Control the leverage used for {token} positions. The maximum
						leverage is {maxLeverage}x.
					</DialogDescription>
				</DialogHeader>

				<p className="text-xs text-muted-foreground">
					Max position size decreases the higher your leverage. The max position
					size for {localValue}x leverage on {token} is calculated based on
					margin tiers.
				</p>

				<div className="flex items-center gap-3">
					<Slider
						min={1}
						max={maxLeverage}
						step={1}
						value={[localValue]}
						onValueChange={handleSliderChange}
						className="flex-1"
					/>
					<NumberInput
						value={inputValue}
						onValueChange={handleInputChange}
						suffix="x"
						className="w-20"
					/>
				</div>

				<DialogFooter>
					<Button className="w-full" onClick={handleConfirm}>
						Establish Connection
					</Button>
					<div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-center text-xs text-primary">
						Note that setting a higher leverage increases the risk of
						liquidation.
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});
