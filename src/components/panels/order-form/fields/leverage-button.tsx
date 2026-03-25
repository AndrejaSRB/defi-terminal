import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LeverageDialog } from './leverage-dialog';

interface LeverageButtonProps {
	leverage: number;
	onChange: (leverage: number) => void;
}

export const LeverageButton = memo(function LeverageButton({
	leverage,
	onChange,
}: LeverageButtonProps) {
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
			<LeverageDialog
				open={open}
				onOpenChange={setOpen}
				value={leverage}
				onChange={onChange}
			/>
		</>
	);
});
