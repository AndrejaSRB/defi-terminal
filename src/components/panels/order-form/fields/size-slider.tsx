import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

const QUICK_PERCENTS = [0, 25, 50, 75, 100];

interface SizeSliderProps {
	value: number;
	onChange: (percent: number) => void;
}

export const SizeSlider = memo(function SizeSlider({
	value,
	onChange,
}: SizeSliderProps) {
	const handleSliderChange = useCallback(
		(values: number[]) => {
			onChange(values[0]);
		},
		[onChange],
	);

	return (
		<div className="space-y-1.5">
			<Slider
				min={0}
				max={100}
				step={1}
				value={[value]}
				onValueChange={handleSliderChange}
			/>
			<div className="flex justify-between">
				{QUICK_PERCENTS.map((pct) => (
					<button
						key={pct}
						type="button"
						onClick={() => onChange(pct)}
						className={cn(
							'rounded px-1.5 py-0.5 text-[10px] transition-colors',
							value === pct
								? 'bg-primary/20 text-primary'
								: 'text-muted-foreground hover:text-foreground',
						)}
					>
						{pct}%
					</button>
				))}
			</div>
		</div>
	);
});
