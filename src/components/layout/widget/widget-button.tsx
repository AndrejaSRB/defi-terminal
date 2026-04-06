import { memo } from 'react';
import { Button } from '@/components/ui/button';

interface WidgetButtonProps {
	amount: string;
	amountError: string | null;
	bridgeDepositError: string | null;
	isValidAmount: boolean;
	isDirectDeposit: boolean;
	isLoadingRoutes: boolean;
	isDepositing: boolean;
	hasRoute: boolean;
	needsChainSwitch: boolean;
	chainName: string;
	bridgeName: string | undefined;
	destinationName: string;
	onSwitchChain: () => void;
	onExecute: () => void;
}

const WidgetButton = ({
	amount,
	amountError,
	bridgeDepositError,
	isValidAmount,
	isDirectDeposit,
	isLoadingRoutes,
	isDepositing,
	hasRoute,
	needsChainSwitch,
	chainName,
	bridgeName,
	destinationName,
	onSwitchChain,
	onExecute,
}: WidgetButtonProps) => {
	if (needsChainSwitch) {
		return (
			<Button className="w-full" onClick={onSwitchChain}>
				Switch to {chainName}
			</Button>
		);
	}

	if (isDepositing) {
		return (
			<Button className="w-full" disabled>
				Depositing...
			</Button>
		);
	}

	const noAmount = !amount || Number(amount) === 0;
	const isDisabled =
		noAmount ||
		!!amountError ||
		!!bridgeDepositError ||
		(isDirectDeposit
			? !isValidAmount
			: !isValidAmount || !hasRoute || isLoadingRoutes);

	const label = noAmount
		? 'Enter Amount'
		: amountError
			? amountError
			: bridgeDepositError
				? bridgeDepositError
				: isDirectDeposit
					? `Deposit to ${destinationName}`
					: isLoadingRoutes
						? 'Finding Routes...'
						: hasRoute
							? `Bridge & Deposit via ${bridgeName ?? 'LiFi'}`
							: 'No routes available';

	return (
		<Button className="w-full" disabled={isDisabled} onClick={onExecute}>
			{label}
		</Button>
	);
};

export default memo(WidgetButton);
