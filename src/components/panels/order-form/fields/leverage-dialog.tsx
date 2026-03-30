import { memo, useState, useCallback, useEffect } from 'react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { toast } from 'sonner';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeDexExchangeAtom } from '@/atoms/dex';
import {
	walletAddressAtom,
	onboardingBlockerAtom,
} from '@/atoms/user/onboarding';
import { tradingWs } from '@/services/ws';
import { activeMetaAtom } from '../atoms/order-form-derived';
import { leverageAtom, marginModeAtom } from '../atoms/order-form-atoms';
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
}

export const LeverageDialog = memo(function LeverageDialog({
	open,
	onOpenChange,
}: LeverageDialogProps) {
	const token = useAtomValue(activeTokenAtom);
	const meta = useAtomValue(activeMetaAtom);
	const currentLeverage = useAtomValue(leverageAtom);
	const setLeverage = useSetAtom(leverageAtom);
	const maxLeverage = meta?.maxLeverage ?? 50;

	const [localValue, setLocalValue] = useState(currentLeverage);
	const [inputValue, setInputValue] = useState(currentLeverage.toString());

	// Sync local state when dialog opens
	useEffect(() => {
		if (open) {
			setLocalValue(currentLeverage);
			setInputValue(currentLeverage.toString());
		}
	}, [open, currentLeverage]);

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

	const store = useStore();
	const [isConfirming, setIsConfirming] = useState(false);

	const handleConfirm = useCallback(async () => {
		const blocker = store.get(onboardingBlockerAtom);
		if (!blocker) {
			setIsConfirming(true);
			const address = store.get(walletAddressAtom) ?? '';
			store.get(activeDexExchangeAtom).setWalletAddress(address);
			const mode = store.get(marginModeAtom);
			try {
				const exchange = store.get(activeDexExchangeAtom);
				await exchange.updateLeverage(
					{
						coin: token,
						leverage: localValue,
						isCross: mode === 'cross',
					},
					tradingWs,
				);
				toast.success(`Leverage updated to ${localValue}x`);
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Update leverage failed',
				);
				setIsConfirming(false);
				return;
			}
			setIsConfirming(false);
		}
		setLeverage(localValue);
		onOpenChange(false);
	}, [localValue, setLeverage, onOpenChange, store, token]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
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
					<Button
						className="w-full"
						disabled={isConfirming}
						onClick={handleConfirm}
					>
						{isConfirming ? 'Updating...' : 'Confirm'}
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
