import { Search } from 'lucide-react';
import {
	useTokenSelectorData,
	type TokenRow,
} from '@/hooks/use-token-selector-data';
import { sentimentColor } from '@/lib/colors';

interface TokenSelectorProps {
	onSelect: (symbol: string) => void;
	onClose: () => void;
}

export function TokenSelector({ onSelect, onClose }: TokenSelectorProps) {
	const { filteredTokens, search, setSearch } = useTokenSelectorData();

	const handleSelect = (token: TokenRow) => {
		onSelect(token.symbol);
	};

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40 bg-black/50"
				onClick={onClose}
				onKeyDown={(e) => e.key === 'Escape' && onClose()}
			/>

			{/* Panel */}
			<div className="absolute left-0 right-0 top-full z-50 mx-auto max-w-[980px] rounded-b-sm border border-t-0 border-border bg-card shadow-lg">
				{/* Search */}
				<div className="flex items-center gap-2 border-b border-border px-3 py-2">
					<Search className="size-4 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search tokens..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
						autoFocus
					/>
				</div>

				{/* Table */}
				<div className="max-h-[400px] overflow-y-auto">
					{/* Header */}
					<div className="sticky top-0 z-10 grid grid-cols-3 gap-2 border-b border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground lg:grid-cols-6">
						<span>Symbol</span>
						<span className="text-right">Mark Price</span>
						<span className="hidden text-right lg:block">24h Change</span>
						<span className="hidden text-right lg:block">8h Funding</span>
						<span className="text-right">Volume</span>
						<span className="hidden text-right lg:block">Open Interest</span>
					</div>

					{/* Rows */}
					{filteredTokens.map((token) => (
						<button
							key={token.symbol}
							type="button"
							onClick={() => handleSelect(token)}
							className="grid w-full grid-cols-3 gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-muted/50 lg:grid-cols-6"
						>
							<span className="flex items-center gap-1.5 text-left">
								<span className="font-bold uppercase">{token.displayName}</span>
								{token.dexName && (
									<span className="text-[11px] text-muted-foreground">
										{token.dexName}
									</span>
								)}
								<span className="text-[11px] text-muted-foreground">
									{token.leverage}
								</span>
							</span>
							<span className="text-right">{token.markPrice}</span>
							<span
								className={`hidden text-right lg:block ${sentimentColor(token.change24hValue)}`}
							>
								{token.change24h}
							</span>
							<span className="hidden text-right lg:block">
								{token.fundingRate}
							</span>
							<span className="text-right">{token.volume24h}</span>
							<span className="hidden text-right lg:block">
								{token.openInterest}
							</span>
						</button>
					))}

					{filteredTokens.length === 0 && (
						<div className="px-3 py-6 text-center text-xs text-muted-foreground">
							No tokens found
						</div>
					)}
				</div>
			</div>
		</>
	);
}
