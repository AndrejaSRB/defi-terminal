import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { Search, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sentimentColor } from '@/lib/colors';
import { toggleFavoriteAtom } from '@/atoms/user/token-favorites';
import {
	useTokenSelectorData,
	type TokenRow,
} from './hooks/use-token-selector-data';

interface TokenSelectorProps {
	onSelect: (symbol: string) => void;
	onClose: () => void;
}

export function TokenSelector({ onSelect, onClose }: TokenSelectorProps) {
	const {
		filteredTokens,
		search,
		setSearch,
		activeCategory,
		setActiveCategory,
		categories,
	} = useTokenSelectorData();
	const toggleFavorite = useSetAtom(toggleFavoriteAtom);

	const handleSelect = (token: TokenRow) => {
		onSelect(token.symbol);
	};

	const handleToggleFavorite = useCallback(
		(event: React.MouseEvent, coin: string) => {
			event.stopPropagation();
			toggleFavorite(coin);
		},
		[toggleFavorite],
	);

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40 bg-black/50"
				onClick={onClose}
				onKeyDown={(event) => event.key === 'Escape' && onClose()}
			/>

			{/* Panel */}
			<div className="absolute left-0 right-0 top-full z-50 mx-auto max-w-[980px] rounded-b-sm border border-t-0 border-border bg-card shadow-lg">
				{/* Search + Category Tabs */}
				<div className="border-b border-border px-3 py-2">
					<div className="flex items-center gap-2">
						<Search className="size-4 shrink-0 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search tokens..."
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
							autoFocus
						/>
					</div>
					<div className="mt-2 flex items-center gap-1">
						<button
							type="button"
							onClick={() => setActiveCategory('favorites')}
							className={cn(
								'flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors',
								activeCategory === 'favorites'
									? 'bg-primary/10 text-primary'
									: 'text-muted-foreground hover:text-foreground',
							)}
						>
							<Star
								className={cn(
									'size-3',
									activeCategory === 'favorites' && 'fill-primary',
								)}
							/>
							Favorites
						</button>
						{categories.map((category) => (
							<button
								key={category.id}
								type="button"
								onClick={() => setActiveCategory(category.id)}
								className={cn(
									'rounded px-2 py-0.5 text-[11px] transition-colors',
									activeCategory === category.id
										? 'bg-primary/10 text-primary'
										: 'text-muted-foreground hover:text-foreground',
								)}
							>
								{category.label}
							</button>
						))}
					</div>
				</div>

				{/* Table */}
				<div className="max-h-[400px] overflow-y-auto">
					{/* Header */}
					<div className="sticky top-0 z-10 grid grid-cols-[20px_1fr_1fr_1fr] gap-2 border-b border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground lg:grid-cols-[20px_1.5fr_1fr_1fr_1fr_1fr_1fr]">
						<span />
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
							className="grid w-full grid-cols-[20px_1fr_1fr_1fr] gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-muted/50 lg:grid-cols-[20px_1.5fr_1fr_1fr_1fr_1fr_1fr]"
						>
							<span
								className="flex items-center"
								onClick={(event) => handleToggleFavorite(event, token.symbol)}
								onKeyDown={() => {}}
							>
								<Star
									className={cn(
										'size-3 transition-colors',
										token.isFavorite
											? 'fill-yellow-400 text-yellow-400'
											: 'text-muted-foreground/30 hover:text-yellow-400',
									)}
								/>
							</span>
							<span className="flex items-center gap-1.5 text-left">
								<span className="relative size-4 shrink-0">
									<span className="absolute inset-0 rounded-full bg-muted" />
									<img
										src={token.imageUrl}
										alt=""
										className="relative size-4 rounded-full bg-white/10 p-px"
										onError={(event) => {
											event.currentTarget.style.display = 'none';
										}}
									/>
								</span>
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
								className={cn(
									'hidden text-right lg:block',
									sentimentColor(token.change24hValue),
								)}
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
