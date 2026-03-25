import * as React from 'react';
import { cn } from '@/lib/utils';

interface NumberInputProps
	extends Omit<
		React.ComponentProps<'input'>,
		'onChange' | 'type' | 'prefix' | 'suffix'
	> {
	value: string;
	onValueChange: (value: string) => void;
	prefix?: React.ReactNode;
	suffix?: React.ReactNode;
}

const NUMERIC_REGEX = /^-?\d*\.?\d*$/;

function NumberInput({
	className,
	value,
	onValueChange,
	prefix,
	suffix,
	...props
}: NumberInputProps) {
	const handleChange = React.useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const raw = e.target.value;
			if (raw === '' || NUMERIC_REGEX.test(raw)) {
				onValueChange(raw);
			}
		},
		[onValueChange],
	);

	return (
		<div
			data-slot="number-input"
			className={cn(
				'flex h-8 items-center gap-1 rounded-md border border-border bg-transparent px-2 text-sm transition-colors',
				'focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50',
				className,
			)}
		>
			{prefix && (
				<span className="shrink-0 text-xs text-muted-foreground">{prefix}</span>
			)}
			<input
				type="text"
				inputMode="decimal"
				autoComplete="off"
				value={value}
				onChange={handleChange}
				className="w-0 min-w-0 flex-1 bg-transparent text-right text-sm text-foreground outline-none placeholder:text-muted-foreground"
				{...props}
			/>
			{suffix && (
				<span className="shrink-0 text-xs text-muted-foreground">{suffix}</span>
			)}
		</div>
	);
}

export { NumberInput };
export type { NumberInputProps };
