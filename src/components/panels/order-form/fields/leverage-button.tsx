import { memo, useCallback, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Button } from '@/components/ui/button';
import { leverageAtom } from '../atoms/order-form-atoms';
import { LeverageDialog } from './leverage-dialog';

export const LeverageButton = memo(function LeverageButton() {
	const leverage = useAtomValue(leverageAtom);
	const [open, setOpen] = useState(false);

	const handleClick = useCallback(() => setOpen(true), []);

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
