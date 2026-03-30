import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import { Input } from '@/components/ui/input';
import { useWithdraw } from './hooks/use-withdraw';

interface WithdrawDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function WithdrawDialog({ open, onOpenChange }: WithdrawDialogProps) {
	const withdraw = useWithdraw();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md" preventOutsideClose>
				<DialogHeader className="text-left">
					<DialogTitle>Withdraw</DialogTitle>
					<DialogDescription>
						Withdraw {withdraw.withdrawConfig.tokenSymbol} from your{' '}
						{withdraw.dexName} account.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Balance */}
					<div className="rounded-lg border border-border bg-muted/20 p-3">
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-foreground">
								Available balance
							</span>
							<span className="text-sm font-medium text-foreground">
								{withdraw.isLoadingBalance
									? '...'
									: `${withdraw.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${withdraw.withdrawConfig.tokenSymbol}`}
							</span>
						</div>
					</div>

					{/* Amount */}
					<div className="space-y-1">
						<span className="text-xs font-medium text-muted-foreground">
							Amount
						</span>
						<div className="flex items-center gap-2">
							<NumberInput
								value={withdraw.amount}
								onValueChange={withdraw.setAmount}
								placeholder="0.00"
								maxDecimals={2}
								className="flex-1"
							/>
							<Button
								size="sm"
								variant="secondary"
								onClick={withdraw.handleMaxClick}
								className="text-xs"
							>
								MAX
							</Button>
						</div>
						{withdraw.amountError && (
							<p className="text-xs text-red-400">{withdraw.amountError}</p>
						)}
					</div>

					{/* Destination */}
					<div className="space-y-1">
						<span className="text-xs font-medium text-muted-foreground">
							Destination address
						</span>
						<Input
							value={withdraw.destination}
							onChange={(event) => withdraw.setDestination(event.target.value)}
							placeholder={withdraw.effectiveDestination}
							className="font-mono text-xs placeholder:text-muted-foreground/50"
						/>
						<p className="text-xs text-muted-foreground">
							Leave empty to withdraw to your connected wallet.
						</p>
					</div>

					{/* Fee info */}
					{withdraw.parsedAmount > 0 && !withdraw.amountError && (
						<div className="space-y-1 rounded-lg border border-border bg-muted/10 p-3 text-xs">
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{withdraw.dexName} fee
								</span>
								<span className="text-foreground">
									${withdraw.withdrawConfig.fee.toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">You receive</span>
								<span className="font-medium text-foreground">
									{withdraw.receiveAmount.toFixed(2)}{' '}
									{withdraw.withdrawConfig.tokenSymbol}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Est. time</span>
								<span className="text-foreground">
									{withdraw.withdrawConfig.estimatedTime}
								</span>
							</div>
						</div>
					)}

					{/* Withdraw button */}
					<Button
						className="w-full"
						disabled={!withdraw.isValidAmount || withdraw.isWithdrawing}
						onClick={withdraw.handleWithdraw}
					>
						{withdraw.isWithdrawing
							? 'Withdrawing...'
							: !withdraw.amount || withdraw.parsedAmount === 0
								? 'Enter Amount'
								: withdraw.amountError
									? withdraw.amountError
									: 'Withdraw'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
