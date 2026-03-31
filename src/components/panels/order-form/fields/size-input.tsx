import { memo, useMemo } from 'react';
import { NumberInput } from '@/components/ui/number-input';
import { ToggleGroup } from '@/components/ui/toggle-group';

interface SizeInputProps {
	value: string;
	onChange: (value: string) => void;
	denom: 'coin' | 'usd';
	onDenomChange: (denom: 'coin' | 'usd') => void;
	token: string;
	szDecimals: number;
}

export const SizeInput = memo(function SizeInput({
	value,
	onChange,
	denom,
	onDenomChange,
	token,
	szDecimals,
}: SizeInputProps) {
	const assetLabel = token.includes('-') ? token.split('-')[0] : token;
	const denomOptions = useMemo(
		() => [
			{ value: 'coin' as const, label: assetLabel },
			{ value: 'usd' as const, label: 'USD' },
		],
		[assetLabel],
	);

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between">
				<span className="text-xs text-muted-foreground">Size</span>
				<ToggleGroup
					options={denomOptions}
					value={denom}
					onValueChange={onDenomChange}
					size="sm"
					className="w-auto"
				/>
			</div>
			<NumberInput
				value={value}
				onValueChange={onChange}
				suffix={denom === 'coin' ? assetLabel : 'USD'}
				placeholder="0.00"
				maxDecimals={denom === 'coin' ? szDecimals : 2}
			/>
		</div>
	);
});
