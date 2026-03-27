import { memo, useState, useCallback } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CloseAllDialogProps {
	onConfirm: () => void;
	isClosing: boolean;
}

export const CloseAllDialog = memo(function CloseAllDialog({
	onConfirm,
	isClosing,
}: CloseAllDialogProps) {
	const [open, setOpen] = useState(false);

	const handleOpen = useCallback(() => setOpen(true), []);

	const handleConfirm = useCallback(() => {
		onConfirm();
		setOpen(false);
	}, [onConfirm]);

	return (
		<>
			<button
				type="button"
				disabled={isClosing}
				onClick={handleOpen}
				className="font-medium text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
			>
				Close All
			</button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Close All Positions</DialogTitle>
						<DialogDescription>
							Are you sure you want to close all open positions at market price?
							This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<div className="flex w-full gap-2">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => setOpen(false)}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								className="flex-1"
								disabled={isClosing}
								onClick={handleConfirm}
							>
								{isClosing ? 'Closing...' : 'Close All'}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
});
