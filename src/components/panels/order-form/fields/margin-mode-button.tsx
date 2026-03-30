import { memo, useCallback, useState } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { marginModeAtom } from '../atoms/order-form-atoms';
import { MarginModeDialog } from './margin-mode-dialog';

export const MarginModeButton = memo(function MarginModeButton() {
	const mode = useAtomValue(marginModeAtom);
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
				className="flex-1 capitalize"
				onClick={handleClick}
			>
				{mode}
			</Button>
			<MarginModeDialog open={open} onOpenChange={setOpen} />
		</>
	);
});
