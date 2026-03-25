import * as React from 'react';
import { Slider as SliderPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

function Slider({
	className,
	defaultValue,
	value,
	min = 0,
	max = 100,
	...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
	const resolvedValue = value ?? defaultValue ?? [min];

	return (
		<SliderPrimitive.Root
			data-slot="slider"
			value={value}
			defaultValue={defaultValue}
			min={min}
			max={max}
			className={cn(
				'relative flex w-full touch-none items-center select-none',
				className,
			)}
			{...props}
		>
			<SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-muted">
				<SliderPrimitive.Range
					className="absolute h-full bg-primary"
					style={{
						boxShadow:
							resolvedValue[0] > min
								? '0 0 6px hsl(var(--primary) / 0.4)'
								: 'none',
					}}
				/>
			</SliderPrimitive.Track>
			{resolvedValue.map((_, index) => (
				<SliderPrimitive.Thumb
					key={index}
					className="block size-3.5 rounded-full border-2 border-primary bg-background shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
				/>
			))}
		</SliderPrimitive.Root>
	);
}

export { Slider };
