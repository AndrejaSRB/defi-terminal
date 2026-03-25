import { memo } from 'react';

interface OrderInfoFooterProps {
	info: {
		liquidationPrice: string;
		orderValue: string;
		marginRequired: string;
		slippage: string;
		fees: string;
	};
}

const ROWS: { key: keyof OrderInfoFooterProps['info']; label: string }[] = [
	{ key: 'liquidationPrice', label: 'Liquidation Price' },
	{ key: 'orderValue', label: 'Order Value' },
	{ key: 'marginRequired', label: 'Margin Required' },
	{ key: 'slippage', label: 'Slippage' },
	{ key: 'fees', label: 'Fees' },
];

export const OrderInfoFooter = memo(function OrderInfoFooter({
	info,
}: OrderInfoFooterProps) {
	return (
		<div className="space-y-1 text-xs">
			{ROWS.map((row) => (
				<div key={row.key} className="flex justify-between">
					<span className="text-muted-foreground">{row.label}</span>
					<span className="text-foreground">{info[row.key]}</span>
				</div>
			))}
		</div>
	);
});
