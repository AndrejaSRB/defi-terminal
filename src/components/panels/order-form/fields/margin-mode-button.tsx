import { memo, useCallback, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Button } from '@/components/ui/button';
import { marginModeAtom } from '../atoms/order-form-atoms';
import { MarginModeDialog } from './margin-mode-dialog';

export const MarginModeButton = memo(function MarginModeButton() {
	const mode = useAtomValue(marginModeAtom);
	const [open, setOpen] = useState(false);

	const handleClick = useCallback(() => setOpen(true), []);

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
