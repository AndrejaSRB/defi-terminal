import { memo } from 'react';
import { ToggleGroup } from '@/components/ui/toggle-group';

const OPTIONS = [
	{ value: 'market' as const, label: 'Market' },
	{ value: 'limit' as const, label: 'Limit' },
];

interface OrderTypeTabsProps {
	value: 'market' | 'limit';
	onChange: (value: 'market' | 'limit') => void;
}

export const OrderTypeTabs = memo(function OrderTypeTabs({
	value,
	onChange,
}: OrderTypeTabsProps) {
	return (
		<ToggleGroup
			options={OPTIONS}
			value={value}
			onValueChange={onChange}
			variant="line"
		/>
	);
});
