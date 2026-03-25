import * as React from 'react';
import { cn } from '@/lib/utils';

interface ToggleGroupOption<T extends string = string> {
	value: T;
	label: React.ReactNode;
}

interface ToggleGroupProps<T extends string = string> {
	options: ToggleGroupOption<T>[];
	value: T;
	onValueChange: (value: T) => void;
	variant?: 'default' | 'line';
	size?: 'sm' | 'default';
	colorMap?: Partial<Record<T, string>>;
	className?: string;
}

function ToggleGroup<T extends string = string>({
	options,
	value,
	onValueChange,
	variant = 'default',
	size = 'default',
	colorMap,
	className,
}: ToggleGroupProps<T>) {
	return (
		<div
			data-slot="toggle-group"
			data-variant={variant}
			className={cn(
				'inline-flex w-full items-center',
				variant === 'default' && 'rounded-md bg-muted p-0.5',
				variant === 'line' && 'gap-1 border-b border-border',
				className,
			)}
		>
			{options.map((option) => {
				const isActive = option.value === value;
				const activeColor = colorMap?.[option.value];

				return (
					<button
						key={option.value}
						type="button"
						data-active={isActive || undefined}
						onClick={() => onValueChange(option.value)}
						className={cn(
							'flex-1 text-center font-medium transition-all duration-150 select-none',
							size === 'default' && 'px-2 py-1 text-xs',
							size === 'sm' && 'px-1.5 py-0.5 text-[11px]',
							variant === 'default' && [
								'rounded-[5px]',
								isActive
									? (activeColor ?? 'bg-background text-foreground shadow-sm')
									: 'text-muted-foreground hover:text-foreground',
							],
							variant === 'line' && [
								'relative pb-1.5',
								'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:scale-x-0 after:bg-primary after:transition-transform after:duration-200',
								isActive
									? 'text-foreground after:scale-x-100'
									: 'text-muted-foreground hover:text-foreground',
							],
						)}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}

export { ToggleGroup };
export type { ToggleGroupOption, ToggleGroupProps };
