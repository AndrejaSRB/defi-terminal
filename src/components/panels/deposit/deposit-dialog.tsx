import { useCallback, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Wallet, ArrowLeftRight, CreditCard, ArrowLeft } from 'lucide-react';
import { useFundWallet } from '@privy-io/react-auth';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { activeNormalizerAtom } from '@/atoms/dex';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { getChainName } from '@/services/chains/config';
import { useDepositBalance } from './hooks/use-deposit-balance';
import DepositTab from './deposit-tab';
import CrosschainTab from './crosschain-tab';

type DepositView = 'select' | 'deposit' | 'crosschain';

interface DepositDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DepositDialog({ open, onOpenChange }: DepositDialogProps) {
	const [view, setView] = useState<DepositView>('select');
	const normalizer = useAtomValue(activeNormalizerAtom);
	const walletAddress = useAtomValue(walletAddressAtom);
	const { balance, isLoading: isLoadingBalance } = useDepositBalance();
	const { fundWallet } = useFundWallet();

	const { depositConfig } = normalizer;
	const chainName = getChainName(depositConfig.chainId);

	const openDeposit = useCallback(() => setView('deposit'), []);
	const openCrosschain = useCallback(() => setView('crosschain'), []);
	const goBack = useCallback(() => setView('select'), []);

	const handleBuyWithCard = useCallback(async () => {
		if (!walletAddress) return;
		await fundWallet({ address: walletAddress });
	}, [walletAddress, fundWallet]);

	const handleCrosschainSuccess = useCallback(() => {
		setView('deposit');
	}, []);

	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			if (!newOpen) setView('select');
			onOpenChange(newOpen);
		},
		[onOpenChange],
	);

	const balanceDisplay = isLoadingBalance
		? '...'
		: `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-md" preventOutsideClose>
				{/* Header with back button for sub-views */}
				<DialogHeader className="text-left">
					<div className="flex items-center gap-2">
						{view !== 'select' && (
							<button
								type="button"
								onClick={goBack}
								className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								<ArrowLeft className="size-4" />
							</button>
						)}
						<div>
							<DialogTitle>
								{view === 'select' && 'Deposit'}
								{view === 'deposit' && `Deposit ${depositConfig.tokenSymbol}`}
								{view === 'crosschain' && 'Transfer Crypto'}
							</DialogTitle>
							{view === 'select' && (
								<DialogDescription>
									Choose how to fund your trading account.
								</DialogDescription>
							)}
						</div>
					</div>
				</DialogHeader>

				{/* Method selector */}
				{view === 'select' && (
					<div className="space-y-2">
						{/* Native deposit */}
						<button
							type="button"
							onClick={openDeposit}
							className={cn(
								'flex w-full items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors',
								'hover:border-primary/50 hover:bg-muted/30',
							)}
						>
							<div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
								<Wallet className="size-5" />
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium text-foreground">
									{depositConfig.tokenSymbol} on {chainName}
								</p>
								<p className="text-xs text-muted-foreground">
									{balanceDisplay} · Instant
								</p>
							</div>
						</button>

						{/* Cross-chain bridge */}
						<button
							type="button"
							onClick={openCrosschain}
							className={cn(
								'flex w-full items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors',
								'hover:border-primary/50 hover:bg-muted/30',
							)}
						>
							<div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
								<ArrowLeftRight className="size-5" />
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium text-foreground">
									Transfer Crypto
								</p>
								<p className="text-xs text-muted-foreground">
									Any chain · 1-5 min
								</p>
							</div>
						</button>

						{/* Buy with card */}
						<button
							type="button"
							onClick={handleBuyWithCard}
							className={cn(
								'flex w-full items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors',
								'hover:border-primary/50 hover:bg-muted/30',
							)}
						>
							<div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
								<CreditCard className="size-5" />
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium text-foreground">
									Buy with Card
								</p>
								<p className="text-xs text-muted-foreground">
									Visa / Mastercard · 5 min
								</p>
							</div>
						</button>
					</div>
				)}

				{/* Deposit sub-view */}
				{view === 'deposit' && <DepositTab />}

				{/* Cross-chain sub-view */}
				{view === 'crosschain' && (
					<CrosschainTab onSuccess={handleCrosschainSuccess} />
				)}
			</DialogContent>
		</Dialog>
	);
}
