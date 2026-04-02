import { useCallback, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { ArrowLeftRight, CreditCard, ArrowLeft, Coins } from 'lucide-react';
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
import Widget from '@/components/layout/widget/widget';
import type { WidgetConfig } from '@/components/layout/widget/types';
import ExtendedDeposit from './extended/extended-deposit';

type DepositView = 'select' | 'crosschain' | 'bridge-usdc';

interface DepositDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DepositDialog({ open, onOpenChange }: DepositDialogProps) {
	const [view, setView] = useState<DepositView>('select');
	const normalizer = useAtomValue(activeNormalizerAtom);
	const walletAddress = useAtomValue(walletAddressAtom);
	const { fundWallet } = useFundWallet();

	const { depositConfig } = normalizer;
	const methods = depositConfig.methods;

	const widgetConfig: WidgetConfig = useMemo(
		() => ({
			destinationChainId: depositConfig.chainId,
			destinationTokenAddress: depositConfig.tokenAddress,
			destinationTokenSymbol: depositConfig.tokenSymbol,
			destinationTokenDecimals: depositConfig.tokenDecimals,
			bridgeAddress: depositConfig.bridgeAddress,
			minDeposit: depositConfig.minDeposit,
			directDepositFee: depositConfig.fee,
			directDepositTime: depositConfig.estimatedTime,
		}),
		[depositConfig],
	);

	const goBack = useCallback(() => setView('select'), []);

	const handleBuyWithCard = useCallback(async () => {
		if (!walletAddress) return;
		await fundWallet({ address: walletAddress });
	}, [walletAddress, fundWallet]);

	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			if (!newOpen) setView('select');
			onOpenChange(newOpen);
		},
		[onOpenChange],
	);

	const viewTitles: Record<DepositView, string> = {
		select: 'Deposit',
		crosschain: 'Deposit & Bridge',
		'bridge-usdc': 'Deposit USDC',
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-md" preventOutsideClose>
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
							<DialogTitle>{viewTitles[view]}</DialogTitle>
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
						{/* Deposit & Bridge — HL (LI.FI + direct deposit) */}
						{(methods.includes('native') ||
							methods.includes('cross-chain')) && (
							<MethodButton
								icon={<ArrowLeftRight className="size-5" />}
								title="Deposit & Bridge"
								subtitle="Any chain · Instant to 5 min"
								onClick={() => setView('crosschain')}
							/>
						)}

						{/* Bridge USDC — Extended only */}
						{methods.includes('bridge-usdc') && (
							<MethodButton
								icon={<Coins className="size-5" />}
								title="Deposit USDC"
								subtitle="Arbitrum, Ethereum, Base... · ~2 min"
								onClick={() => setView('bridge-usdc')}
							/>
						)}

						{/* Buy with card — both DEXes */}
						{methods.includes('card') && (
							<MethodButton
								icon={<CreditCard className="size-5" />}
								title="Buy with Card"
								subtitle="Visa / Mastercard · 5 min"
								onClick={handleBuyWithCard}
							/>
						)}
					</div>
				)}

				{view === 'crosschain' && <Widget config={widgetConfig} />}
				{view === 'bridge-usdc' && <ExtendedDeposit />}
			</DialogContent>
		</Dialog>
	);
}

/** Reusable method button for the selector */
function MethodButton({
	icon,
	title,
	subtitle,
	onClick,
}: {
	icon: React.ReactNode;
	title: string;
	subtitle: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'flex w-full items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors',
				'hover:border-primary/50 hover:bg-muted/30',
			)}
		>
			<div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
				{icon}
			</div>
			<div className="flex-1">
				<p className="text-sm font-medium text-foreground">{title}</p>
				<p className="text-xs text-muted-foreground">{subtitle}</p>
			</div>
		</button>
	);
}
