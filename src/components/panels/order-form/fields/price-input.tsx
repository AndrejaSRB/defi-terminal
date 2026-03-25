import { memo } from 'react';
import { NumberInput } from '@/components/ui/number-input';

interface PriceInputProps {
	value: string;
	onChange: (value: string) => void;
	label: string;
	maxDecimals?: number;
}

export const PriceInput = memo(function PriceInput({
	value,
	onChange,
	label,
	maxDecimals,
}: PriceInputProps) {
	return (
		<div className="space-y-1">
			<span className="text-xs text-muted-foreground">{label}</span>
			<NumberInput
				value={value}
				onValueChange={onChange}
				prefix="$"
				placeholder="0.00"
				maxDecimals={maxDecimals}
			/>
		</div>
	);
});
