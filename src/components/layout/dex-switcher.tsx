import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { activeDexIdAtom, DEX_REGISTRY } from '@/atoms/dex';

export function DexSwitcher() {
	const [activeDexId, setActiveDexId] = useAtom(activeDexIdAtom);

	const activeDex = DEX_REGISTRY.find((dex) => dex.id === activeDexId);

	const handleSwitch = useCallback(
		(dexId: string) => {
			if (dexId === activeDexId) return;
			setActiveDexId(dexId);
		},
		[activeDexId, setActiveDexId],
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button size="sm" variant="ghost" className="gap-1 text-xs">
					{activeDex?.name ?? 'DEX'}
					<ChevronDown className="size-3 text-muted-foreground" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{DEX_REGISTRY.map((dex) => (
					<DropdownMenuItem
						key={dex.id}
						onClick={() => handleSwitch(dex.id)}
						className="gap-2"
					>
						{dex.id === activeDexId && (
							<Check className="size-3.5 text-primary" />
						)}
						<span className={dex.id !== activeDexId ? 'pl-5' : ''}>
							{dex.name}
						</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
