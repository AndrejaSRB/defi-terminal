import { memo, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import ChainSelector from '@/components/panels/deposit/extended/chain-selector';
import { warmupSigner } from '@/normalizer/extended/services/signer-warmup';
import { useExtendedWithdrawForm } from './hooks/use-extended-withdraw-form';
import { useExtendedWithdrawAction } from './hooks/use-extended-withdraw-action';

/** Supported chains for withdrawal (same as deposit, from /bridge/config) */
const WITHDRAW_CHAINS = [
	{ chain: 'ARB', contractAddress: '' },
	{ chain: 'ETH', contractAddress: '' },
	{ chain: 'BASE', contractAddress: '' },
	{ chain: 'BNB', contractAddress: '' },
	{ chain: 'AVALANCHE', contractAddress: '' },
	{ chain: 'POLYGON', contractAddress: '' },
];

const ExtendedWithdraw = () => {
	// Wake up the signer service (Render free tier sleeps after 15 min)
	useEffect(() => {
		warmupSigner();
	}, []);

	const form = useExtendedWithdrawForm();
	const action = useExtendedWithdrawAction({
		walletAddress: form.walletAddress,
		chainMeta: form.chainMeta,
		selectedChain: form.selectedChain,
	});

	const isProcessing =
		action.status !== 'idle' &&
		action.status !== 'error' &&
		action.status !== 'success';

	const handleWithdraw = () => {
		if (!form.isValid) return;
		action.execute(form.parsedAmount);
	};

	const statusLabel: Record<string, string> = {
		quoting: 'Getting quote...',
		committing: 'Confirming...',
		signing: 'Signing withdrawal...',
		submitting: 'Submitting...',
	};

	if (action.status === 'success') {
		return (
			<div className="space-y-5 py-4 text-center">
				<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-500/10">
					<span className="text-xl text-green-500">&#10003;</span>
				</div>
				<div className="space-y-1">
					<p className="text-base font-medium text-foreground">
						Withdrawal Submitted
					</p>
					<p className="text-sm text-muted-foreground">
						Your {form.amount} USDC withdrawal to{' '}
						{form.chainMeta?.name ?? form.selectedChain} is being processed.
						Funds will arrive in approximately 2-20 minutes.
					</p>
				</div>
				<Button
					onClick={() => {
						action.reset();
						form.setAmount('');
					}}
					variant="outline"
					className="w-full"
				>
					New Withdrawal
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Chain selector */}
			<div className="space-y-1.5">
				<span className="text-xs text-muted-foreground">Destination Chain</span>
				<ChainSelector
					chains={WITHDRAW_CHAINS}
					selected={form.selectedChain}
					onSelect={form.setSelectedChain}
				/>
			</div>

			{/* Available balance */}
			<div className="rounded-lg border border-border bg-muted/20 p-3">
				<div className="flex items-center justify-between">
					<span className="text-xs text-muted-foreground">
						Available to Withdraw
					</span>
					<span className="text-sm font-medium text-foreground">
						{form.availableBalance.toLocaleString('en-US', {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}{' '}
						USDC
					</span>
				</div>
			</div>

			{/* Amount input */}
			<div className="space-y-1.5">
				<div className="flex items-center justify-between">
					<span className="text-xs text-muted-foreground">Amount</span>
					<button
						type="button"
						onClick={form.setMax}
						className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
					>
						MAX
					</button>
				</div>
				<NumberInput
					value={form.amount}
					onValueChange={form.setAmount}
					suffix="USDC"
					placeholder="0.00"
					maxDecimals={2}
				/>
				{form.amountError && (
					<p className="text-xs text-destructive">{form.amountError}</p>
				)}
			</div>

			{/* Withdraw button */}
			<Button
				onClick={handleWithdraw}
				disabled={!form.isValid || isProcessing}
				className="w-full"
			>
				{isProcessing ? (
					<>
						<Loader2 className="mr-2 size-4 animate-spin" />
						{statusLabel[action.status] ?? 'Processing...'}
					</>
				) : (
					'Withdraw'
				)}
			</Button>

			{action.status === 'error' && (
				<p className="text-center text-xs text-destructive">
					Withdrawal failed. Please try again.
				</p>
			)}
		</div>
	);
};

export default memo(ExtendedWithdraw);
