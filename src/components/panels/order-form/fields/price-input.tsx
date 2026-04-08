import { memo } from 'react';
import { NumberInput } from '@/components/ui/number-input';

interface PriceInputProps {
	value: string;
	onChange: (value: string) => void;
	label: string;
	maxDecimals?: number;
	onMidClick?: () => void;
}

export const PriceInput = memo(function PriceInput({
	value,
	onChange,
	label,
	maxDecimals,
	onMidClick,
}: PriceInputProps) {
	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between">
				<span className="text-xs text-muted-foreground">{label}</span>
				{onMidClick && (
					<button
						type="button"
						onClick={onMidClick}
						className="text-[10px] font-medium text-primary hover:text-primary/80"
					>
						Mid
					</button>
				)}
			</div>
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
