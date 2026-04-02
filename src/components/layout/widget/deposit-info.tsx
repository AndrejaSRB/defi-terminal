import { memo } from 'react';
import { Clock, CircleDollarSign } from 'lucide-react';
import type { WidgetConfig } from './types';

interface DepositInfoProps {
	config: WidgetConfig;
	amount: string;
}

const DepositInfo = ({ config, amount }: DepositInfoProps) => {
	const parsedAmount = Number(amount);
	const receiveAmount = Math.max(
		0,
		parsedAmount - config.directDepositFee,
	).toFixed(2);

	return (
		<div className="space-y-1.5 rounded-lg border border-border bg-muted/10 p-3 text-xs">
			<div className="flex justify-between">
				<span className="flex items-center gap-1.5 text-muted-foreground">
					<Clock className="size-3" />
					Est. time
				</span>
				<span className="text-foreground">{config.directDepositTime}</span>
			</div>
			<div className="flex justify-between">
				<span className="flex items-center gap-1.5 text-muted-foreground">
					<CircleDollarSign className="size-3" />
					Deposit fee
				</span>
				<span className="text-foreground">
					${config.directDepositFee.toFixed(2)}
				</span>
			</div>
			{parsedAmount > 0 && (
				<div className="flex justify-between border-t border-border/50 pt-1.5">
					<span className="text-muted-foreground">You receive</span>
					<span className="font-medium text-foreground">
						~{receiveAmount} {config.destinationTokenSymbol}
					</span>
				</div>
			)}
		</div>
	);
};

export default memo(DepositInfo);
