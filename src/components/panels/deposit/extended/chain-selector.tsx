import { memo } from 'react';
import { cn } from '@/lib/utils';
import {
	CHAIN_META,
	type BridgeChain,
} from '@/normalizer/extended/services/bridge-types';

interface ChainSelectorProps {
	chains: BridgeChain[];
	selected: string;
	onSelect: (chain: string) => void;
}

const ChainSelector = ({ chains, selected, onSelect }: ChainSelectorProps) => {
	return (
		<div className="grid grid-cols-3 gap-2">
			{chains.map((chain) => {
				const meta = CHAIN_META[chain.chain];
				const label = meta?.name ?? chain.chain;
				const isSelected = selected === chain.chain;

				return (
					<button
						key={chain.chain}
						type="button"
						onClick={() => onSelect(chain.chain)}
						className={cn(
							'flex items-center justify-center rounded-lg border py-2 text-xs font-medium transition-colors',
							isSelected
								? 'border-primary bg-primary/10 text-primary'
								: 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
						)}
					>
						{label}
					</button>
				);
			})}
		</div>
	);
};

export default memo(ChainSelector);
