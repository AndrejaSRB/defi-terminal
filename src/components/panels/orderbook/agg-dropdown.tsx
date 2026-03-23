import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useAggregation } from './hooks/use-aggregation';

export function AggDropdown() {
	const { levels, active, setLevel } = useAggregation();
	const currentLabel = active?.label ?? levels[0]?.label ?? 'Raw';

	return (
		<Select
			value={currentLabel}
			onValueChange={(val) => {
				const level = levels.find((l) => l.label === val) ?? null;
				setLevel(level);
			}}
		>
			<SelectTrigger className="h-6 w-auto gap-1 border-0 bg-transparent px-1.5 text-[11px] shadow-none ring-0 focus:ring-0 focus-visible:ring-0">
				<SelectValue />
			</SelectTrigger>
			<SelectContent side="bottom" align="start">
				{levels.map((l) => (
					<SelectItem key={l.label} value={l.label} className="text-xs">
						{l.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
