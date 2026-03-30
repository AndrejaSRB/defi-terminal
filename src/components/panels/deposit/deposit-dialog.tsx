import { useCallback, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DepositTab from './deposit-tab';
import CrosschainTab from './crosschain-tab';

interface DepositDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DepositDialog({ open, onOpenChange }: DepositDialogProps) {
	const [activeTab, setActiveTab] = useState('deposit');

	const handleCrosschainSuccess = useCallback(() => {
		setActiveTab('deposit');
	}, []);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader className="text-left">
					<DialogTitle>Deposit</DialogTitle>
					<DialogDescription>
						Deposit funds to your trading account.
					</DialogDescription>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="w-full">
						<TabsTrigger value="deposit" className="flex-1">
							Deposit
						</TabsTrigger>
						<TabsTrigger value="crosschain" className="flex-1">
							Cross-Chain
						</TabsTrigger>
					</TabsList>

					<TabsContent value="deposit" className="mt-4">
						<DepositTab />
					</TabsContent>

					<TabsContent value="crosschain" className="mt-4">
						{activeTab === 'crosschain' && (
							<CrosschainTab onSuccess={handleCrosschainSuccess} />
						)}
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
