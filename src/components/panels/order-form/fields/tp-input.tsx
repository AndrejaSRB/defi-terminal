import { memo } from 'react';
import { NumberInput } from '@/components/ui/number-input';
import { ToggleGroup } from '@/components/ui/toggle-group';

const TOGGLE_OPTIONS = [
	{ value: 'usd' as const, label: '$' },
	{ value: 'pct' as const, label: '%' },
];

interface TpInputProps {
	price: string;
	gain: string;
	onPriceChange: (value: string) => void;
	onGainChange: (value: string) => void;
	toggle: 'usd' | 'pct';
	onToggleChange: (value: 'usd' | 'pct') => void;
}

export const TpInput = memo(function TpInput({
	price,
	gain,
	onPriceChange,
	onGainChange,
	toggle,
	onToggleChange,
}: TpInputProps) {
	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between">
				<span className="text-xs text-muted-foreground">TP Price</span>
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
					placeholder="TP Price"
				/>
				<NumberInput
					value={gain}
					onValueChange={onGainChange}
					placeholder="Gain"
					suffix={toggle === 'pct' ? '%' : '$'}
				/>
			</div>
		</div>
	);
});
