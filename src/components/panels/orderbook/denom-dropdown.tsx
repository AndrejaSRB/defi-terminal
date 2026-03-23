import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useDenomination } from './hooks/use-denomination';
import type { Denomination } from '@/atoms/market-data/denomination';

export function DenomDropdown() {
	const { denom, setDenom, tokenLabel } = useDenomination();

	return (
		<Select
			value={denom}
			onValueChange={(val) => setDenom(val as Denomination)}
		>
			<SelectTrigger className="h-6 w-auto gap-1 border-0 bg-transparent px-1.5 text-[11px] shadow-none ring-0 focus:ring-0 focus-visible:ring-0">
				<SelectValue />
			</SelectTrigger>
			<SelectContent side="bottom" align="end">
				<SelectItem value="token" className="text-xs">
					{tokenLabel}
				</SelectItem>
				<SelectItem value="usd" className="text-xs">
					USD
				</SelectItem>
			</SelectContent>
		</Select>
	);
}
