import { useState, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { cn } from '@/lib/utils';
import { sentimentColor } from '@/lib/colors';
import { Button } from '@/components/ui/button';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { depositDialogOpenAtom } from '@/atoms/ui/deposit-dialog';
import { DepositDialog } from './deposit/deposit-dialog';
import { WithdrawDialog } from './withdraw/withdraw-dialog';
import {
	spotEquityAtom,
	perpsEquityAtom,
	portfolioValueAtom,
	balanceAtom,
	unrealizedPnlAtom,
	crossMarginRatioAtom,
	maintenanceMarginAtom,
	crossAccountLeverageAtom,
} from '@/atoms/user/account';

const fmt = (value: number) =>
	`$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function AccountRow({
	label,
	value,
	className,
}: {
	label: string;
	value: string;
	className?: string;
}) {
	return (
		<div className="flex justify-between">
			<span>{label}</span>
			<span className={cn('text-foreground', className)}>{value}</span>
		</div>
	);
}

export function AccountPanel() {
	const spotEquity = useAtomValue(spotEquityAtom);
	const perpsEquity = useAtomValue(perpsEquityAtom);
	const portfolioValue = useAtomValue(portfolioValueAtom);
	const balance = useAtomValue(balanceAtom);
	const unrealizedPnl = useAtomValue(unrealizedPnlAtom);
	const crossMarginRatio = useAtomValue(crossMarginRatioAtom);
	const maintenanceMargin = useAtomValue(maintenanceMarginAtom);
	const crossLeverage = useAtomValue(crossAccountLeverageAtom);
	const walletAddress = useAtomValue(walletAddressAtom);
	const isConnected = !!walletAddress;

	const depositOpen = useAtomValue(depositDialogOpenAtom);
	const setDepositOpen = useSetAtom(depositDialogOpenAtom);
	const [withdrawOpen, setWithdrawOpen] = useState(false);

	const openDeposit = useCallback(() => setDepositOpen(true), [setDepositOpen]);
	const openWithdraw = useCallback(() => setWithdrawOpen(true), []);

	return (
		<div className="flex h-full flex-col gap-3 overflow-y-auto p-3">
			{isConnected && (
				<>
					<div className="grid grid-cols-2 gap-2">
						<Button size="sm" onClick={openDeposit}>
							Deposit
						</Button>
						<Button size="sm" variant="secondary" onClick={openWithdraw}>
							Withdraw
						</Button>
					</div>
					<DepositDialog open={depositOpen} onOpenChange={setDepositOpen} />
					<WithdrawDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} />
				</>
			)}

			<div className="space-y-2 text-xs">
				<h3 className="font-medium text-foreground">Account Equity</h3>
				<div className="space-y-1 text-muted-foreground">
					<AccountRow label="Spot" value={fmt(spotEquity)} />
					<AccountRow label="Perps (Core)" value={fmt(perpsEquity)} />
					<div className="flex justify-between border-t border-border/50 pt-1">
						<span className="font-medium text-foreground">Portfolio Value</span>
						<span className="font-medium text-foreground">
							{fmt(portfolioValue)}
						</span>
					</div>
				</div>
			</div>

			<div className="space-y-2 text-xs">
				<h3 className="font-medium text-foreground">Perps Overview</h3>
				<div className="space-y-1 text-muted-foreground">
					<AccountRow label="Balance" value={fmt(balance)} />
					<AccountRow
						label="Unrealized PNL"
						value={`${unrealizedPnl >= 0 ? '+' : ''}${fmt(unrealizedPnl)}`}
						className={sentimentColor(unrealizedPnl)}
					/>
					<AccountRow
						label="Cross Margin Ratio"
						value={`${crossMarginRatio.toFixed(2)}%`}
					/>
					<AccountRow
						label="Maintenance Margin"
						value={fmt(maintenanceMargin)}
					/>
					<AccountRow
						label="Cross Account Leverage"
						value={`${crossLeverage.toFixed(2)}x`}
					/>
				</div>
			</div>
		</div>
	);
}
