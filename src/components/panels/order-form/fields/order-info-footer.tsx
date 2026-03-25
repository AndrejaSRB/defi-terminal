import { memo, useState, useCallback } from 'react';
import { SlippageDialog } from './slippage-dialog';

interface OrderInfoFooterProps {
	info: {
		liquidationPrice: string;
		orderValue: string;
		marginRequired: string;
		slippage: string;
		fees: string;
	};
}

export const OrderInfoFooter = memo(function OrderInfoFooter({
	info,
}: OrderInfoFooterProps) {
	const [slippageOpen, setSlippageOpen] = useState(false);

	const handleSlippageClick = useCallback(() => setSlippageOpen(true), []);

	return (
		<div className="space-y-1 text-xs">
			<div className="flex justify-between">
				<span className="text-muted-foreground">Est. Liquidation Price</span>
				<span className="text-foreground">{info.liquidationPrice}</span>
			</div>
			<div className="flex justify-between">
				<span className="text-muted-foreground">Order Value</span>
				<span className="text-foreground">{info.orderValue}</span>
			</div>
			<div className="flex justify-between">
				<span className="text-muted-foreground">Margin Required</span>
				<span className="text-foreground">{info.marginRequired}</span>
			</div>
			<div className="flex justify-between">
				<button
					type="button"
					onClick={handleSlippageClick}
					className="cursor-pointer text-muted-foreground underline decoration-dashed underline-offset-2 transition-colors hover:text-foreground"
				>
					Slippage
				</button>
				<span className="text-foreground">Max: {info.slippage}</span>
			</div>
			<div className="flex justify-between">
				<span
					className="text-muted-foreground"
					title="Only fees applied by DEX. No builder fees."
				>
					Fees
				</span>
				<span className="text-foreground">{info.fees}</span>
			</div>
			<SlippageDialog open={slippageOpen} onOpenChange={setSlippageOpen} />
		</div>
	);
});
