import { memo, useCallback, useState } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { leverageAtom } from '../atoms/order-form-atoms';
import { LeverageDialog } from './leverage-dialog';

export const LeverageButton = memo(function LeverageButton() {
	const leverage = useAtomValue(leverageAtom);
	const walletAddress = useAtomValue(walletAddressAtom);
	const [open, setOpen] = useState(false);

	const handleClick = useCallback(() => {
		if (!walletAddress) {
			toast.error('Please connect your wallet');
			return;
		}
		setOpen(true);
	}, [walletAddress]);

	return (
		<>
			<Button
				variant="outline"
				size="xs"
				className="flex-1"
				onClick={handleClick}
			>
				{leverage}x
			</Button>
			<LeverageDialog open={open} onOpenChange={setOpen} />
		</>
	);
});
