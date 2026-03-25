import { memo, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface ReduceOnlyCheckboxProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
}

export const ReduceOnlyCheckbox = memo(function ReduceOnlyCheckbox({
	checked,
	onChange,
}: ReduceOnlyCheckboxProps) {
	const handleChange = useCallback(
		(value: boolean | 'indeterminate') => {
			onChange(value === true);
		},
		[onChange],
	);

	return (
		<label className="flex cursor-pointer items-center gap-2 text-xs">
			<Checkbox checked={checked} onCheckedChange={handleChange} />
			<span className="text-muted-foreground">Reduce Only</span>
		</label>
	);
});
