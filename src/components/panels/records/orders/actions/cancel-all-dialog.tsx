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

interface CancelAllDialogProps {
	onConfirm: () => void;
	isProcessing: boolean;
}

export const CancelAllDialog = memo(function CancelAllDialog({
	onConfirm,
	isProcessing,
}: CancelAllDialogProps) {
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
				disabled={isProcessing}
				onClick={handleOpen}
				className="font-medium text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
			>
				Cancel All
			</button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Cancel All Orders</DialogTitle>
						<DialogDescription>
							Are you sure you want to cancel all open orders? This action
							cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<div className="flex w-full gap-2">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => setOpen(false)}
							>
								Keep Orders
							</Button>
							<Button
								variant="destructive"
								className="flex-1"
								disabled={isProcessing}
								onClick={handleConfirm}
							>
								{isProcessing ? 'Canceling...' : 'Cancel All'}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
});
