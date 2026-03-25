import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MarginModeDialog } from './margin-mode-dialog';

interface MarginModeButtonProps {
	mode: 'cross' | 'isolated';
	onChange: (mode: 'cross' | 'isolated') => void;
}

export const MarginModeButton = memo(function MarginModeButton({
	mode,
	onChange,
}: MarginModeButtonProps) {
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
			<MarginModeDialog
				open={open}
				onOpenChange={setOpen}
				value={mode}
				onChange={onChange}
			/>
		</>
	);
});
