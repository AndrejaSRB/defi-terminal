import { cn } from '@/lib/utils';
import { sentimentColor } from '@/lib/colors';
import { CoinLink } from '../components/coin-link';
import type { FormattedFunding } from './hooks/use-fundings-data';

export function FundingCard({ funding }: { funding: FormattedFunding }) {
	return (
		<div className="rounded-md border border-border bg-card p-3 text-xs">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5">
					<CoinLink
						coin={funding.coin}
						displayName={funding.displayName}
						dexName={funding.dexName}
					/>
					<span
						className={cn(
							'text-[11px]',
							funding.side === 'Long' ? 'text-green-400' : 'text-red-400',
						)}
					>
						{funding.side}
					</span>
				</div>
				<span className="text-muted-foreground">{funding.time}</span>
			</div>
			<div className="mt-2 grid grid-cols-2 gap-y-1.5 text-muted-foreground">
				<div>
					<span>Size</span>
					<div className="text-foreground">{funding.size}</div>
				</div>
				<div className="text-right">
					<span>Payment</span>
					<div className={sentimentColor(funding.paymentValue)}>
						{funding.payment}
					</div>
				</div>
				<div>
					<span>Rate</span>
					<div className="text-foreground">{funding.rate}</div>
				</div>
			</div>
		</div>
	);
}
