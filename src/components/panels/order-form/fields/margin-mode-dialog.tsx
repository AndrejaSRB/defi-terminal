import { memo, useCallback, useState } from 'react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { toast } from 'sonner';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeDexExchangeAtom } from '@/atoms/dex';
import {
	walletAddressAtom,
	onboardingBlockerAtom,
} from '@/atoms/user/onboarding';

import { cn } from '@/lib/utils';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { marginModeAtom, leverageAtom } from '../atoms/order-form-atoms';

interface MarginModeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const MODES = [
	{
		value: 'cross' as const,
		label: 'Cross',
		description:
			'All cross positions share the same cross margin as collateral. In the event of liquidation, your cross margin balance and any remaining open positions under assets in this mode may be forfeited.',
	},
	{
		value: 'isolated' as const,
		label: 'Isolated',
		description:
			'Manage your risk on individual positions by restricting the amount of margin allocated to each. If the margin ratio of an isolated position reaches 100%, the position will be liquidated. Margin can be added or removed to individual positions in this mode.',
	},
];

export const MarginModeDialog = memo(function MarginModeDialog({
	open,
	onOpenChange,
}: MarginModeDialogProps) {
	const token = useAtomValue(activeTokenAtom);
	const currentMode = useAtomValue(marginModeAtom);
	const setMarginMode = useSetAtom(marginModeAtom);

	const store = useStore();
	const [isConfirming, setIsConfirming] = useState(false);

	const handleSelect = useCallback(
		(mode: 'cross' | 'isolated') => {
			setMarginMode(mode);
		},
		[setMarginMode],
	);

	const handleConfirm = useCallback(async () => {
		const blocker = store.get(onboardingBlockerAtom);
		if (!blocker) {
			const exchange = store.get(activeDexExchangeAtom);
			if (!exchange) {
				toast.error('Trading not available for this DEX');
				return;
			}
			setIsConfirming(true);
			const address = store.get(walletAddressAtom) ?? '';
			exchange.setWalletAddress(address);
			const leverage = store.get(leverageAtom);
			try {
				await exchange.updateMarginMode({
					coin: token,
					leverage,
					isCross: currentMode === 'cross',
				});
				toast.success(`Margin mode set to ${currentMode}`);
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : 'Update margin mode failed',
				);
				setIsConfirming(false);
				return;
			}
			setIsConfirming(false);
		}
		onOpenChange(false);
	}, [store, token, currentMode, onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{token}-USDC Margin Mode</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					{MODES.map((mode) => {
						const isSelected = mode.value === currentMode;
						return (
							<button
								key={mode.value}
								type="button"
								onClick={() => handleSelect(mode.value)}
								className={cn(
									'w-full rounded-lg border p-3 text-left transition-colors',
									isSelected
										? 'border-primary bg-primary/5'
										: 'border-border hover:border-muted-foreground/30',
								)}
							>
								<div className="flex items-center gap-2">
									<Checkbox
										checked={isSelected}
										tabIndex={-1}
										className="pointer-events-none"
									/>
									<span className="text-sm font-medium text-foreground">
										{mode.label}
									</span>
								</div>
								<p className="mt-2 text-xs leading-relaxed text-muted-foreground">
									{mode.description}
								</p>
							</button>
						);
					})}
				</div>

				<DialogFooter>
					<Button
						className="w-full"
						disabled={isConfirming}
						onClick={handleConfirm}
					>
						{isConfirming ? 'Updating...' : 'Confirm'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});
