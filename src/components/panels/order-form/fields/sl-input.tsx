import { memo } from 'react';
import { NumberInput } from '@/components/ui/number-input';
import { ToggleGroup } from '@/components/ui/toggle-group';

const TOGGLE_OPTIONS = [
	{ value: 'usd' as const, label: '$' },
	{ value: 'pct' as const, label: '%' },
];

interface SlInputProps {
	price: string;
	loss: string;
	onPriceChange: (value: string) => void;
	onLossChange: (value: string) => void;
	toggle: 'usd' | 'pct';
	onToggleChange: (value: 'usd' | 'pct') => void;
	maxDecimals?: number;
}

export const SlInput = memo(function SlInput({
	price,
	loss,
	onPriceChange,
	onLossChange,
	toggle,
	onToggleChange,
	maxDecimals,
}: SlInputProps) {
	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between">
				<span className="text-xs text-muted-foreground">SL Price</span>
				<ToggleGroup
					options={TOGGLE_OPTIONS}
					value={toggle}
					onValueChange={onToggleChange}
					size="sm"
					className="w-auto"
				/>
			</div>
			<div className="grid grid-cols-2 gap-1.5">
				<NumberInput
					value={price}
					onValueChange={onPriceChange}
					placeholder="SL Price"
					maxDecimals={maxDecimals}
				/>
				<NumberInput
					value={loss}
					onValueChange={onLossChange}
					placeholder="Loss"
					suffix={toggle === 'pct' ? '%' : '$'}
					maxDecimals={2}
				/>
			</div>
		</div>
	);
});
