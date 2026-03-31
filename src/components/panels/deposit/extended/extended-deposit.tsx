import { memo } from 'react';
import { useAtomValue } from 'jotai';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { useExtendedDepositForm } from './hooks/use-extended-deposit-form';
import { useExtendedDepositAction } from './hooks/use-extended-deposit-action';
import ChainSelector from './chain-selector';

const ExtendedDeposit = () => {
	const walletAddress = useAtomValue(walletAddressAtom);

	const form = useExtendedDepositForm();
	const action = useExtendedDepositAction({
		apiKey: form.apiKey,
		walletAddress,
		chainMeta: form.chainMeta,
		bridgeContract: form.bridgeContract,
	});

	const isProcessing = action.status !== 'idle' && action.status !== 'error';

	const handleDeposit = () => {
		if (!form.quote) return;
		action.execute(form.quote, parseFloat(form.amount));
	};

	const statusLabel: Record<string, string> = {
		committing: 'Confirming quote...',
		approving: 'Approving USDC...',
		depositing: 'Depositing...',
	};

	if (action.status === 'success') {
		return (
			<div className="space-y-5 py-4 text-center">
				<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-500/10">
					<span className="text-xl text-green-500">&#10003;</span>
				</div>
				<div className="space-y-1">
					<p className="text-base font-medium text-foreground">
						Deposit Submitted
					</p>
					<p className="text-sm text-muted-foreground">
						Your {form.amount} USDC deposit from{' '}
						{form.chainMeta?.name ?? form.selectedChain} is being processed.
						Funds will arrive in your Extended account in approximately 2
						minutes.
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
					New Deposit
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Chain selector */}
			<div className="space-y-1.5">
				<span className="text-xs text-muted-foreground">From Chain</span>
				<ChainSelector
					chains={form.chains}
					selected={form.selectedChain}
					onSelect={form.setSelectedChain}
				/>
			</div>

			{/* Amount input */}
			<div className="space-y-1.5">
				<div className="flex items-center justify-between">
					<span className="text-xs text-muted-foreground">Amount</span>
					<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
						{form.isLoadingBalance ? '...' : `${form.balance.toFixed(2)} USDC`}
						<button
							type="button"
							onClick={form.setMax}
							className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
						>
							MAX
						</button>
					</span>
				</div>
				<NumberInput
					value={form.amount}
					onValueChange={form.setAmount}
					suffix="USDC"
					placeholder="0.00"
					maxDecimals={2}
				/>
			</div>

			{/* Quote details */}
			{(form.quote || form.isLoadingQuote) && (
				<div className="space-y-1 rounded-lg border border-border p-3 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">You Receive</span>
						<span className="text-foreground">
							{form.isLoadingQuote
								? '...'
								: `${form.receiveAmount.toFixed(2)} USDC`}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Bridge Fee</span>
						<span className="text-foreground">
							{form.isLoadingQuote ? '...' : `${form.quote?.fee ?? '0'} USDC`}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Est. Time</span>
						<span className="text-foreground">~2 min</span>
					</div>
				</div>
			)}

			{/* Validation */}
			{parseFloat(form.amount) > form.balance && form.balance > 0 && (
				<p className="text-xs text-destructive">
					Insufficient balance. You have {form.balance.toFixed(2)} USDC.
				</p>
			)}

			{/* Deposit button */}
			<Button
				onClick={handleDeposit}
				disabled={!form.isValid || isProcessing}
				className="w-full"
			>
				{isProcessing ? (
					<>
						<Loader2 className="mr-2 size-4 animate-spin" />
						{statusLabel[action.status] ?? 'Processing...'}
					</>
				) : (
					'Deposit'
				)}
			</Button>

			{action.status === 'error' && (
				<p className="text-center text-xs text-destructive">
					Deposit failed. Please try again.
				</p>
			)}
		</div>
	);
};

export default memo(ExtendedDeposit);
