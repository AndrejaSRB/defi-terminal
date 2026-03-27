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
import { slippageAtom } from '../atoms/order-form-atoms';

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

	const [inputValue, setInputValue] = useState(currentSlippage.toString());

	useEffect(() => {
		if (open) {
			setInputValue(currentSlippage.toString());
		}
	}, [open, currentSlippage]);

	const handleInputChange = useCallback((raw: string) => {
		setInputValue(raw);
	}, []);

	const handleConfirm = useCallback(() => {
		const num = Number(inputValue);
		if (num >= 0 && num <= 100) {
			setSlippage(num);
		}
		onOpenChange(false);
	}, [inputValue, setSlippage, onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Max Slippage</DialogTitle>
					<DialogDescription>
						Max slippage only affects market orders placed from the order form.
						Closing positions will use max slippage of 8% and market TP/SL
						orders will use max slippage of 10%.
					</DialogDescription>
				</DialogHeader>

				<NumberInput
					value={inputValue}
					onValueChange={handleInputChange}
					suffix="%"
					maxDecimals={2}
				/>

				<DialogFooter>
					<Button className="w-full" onClick={handleConfirm}>
						Confirm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});
