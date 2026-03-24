import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTokenHeaderExpand } from './hooks/use-token-header-expand';
import { useTokenHeaderData } from './hooks/use-token-header-data';
import { useTokenSelector } from './hooks/use-token-selector';
import { usePriceFlash } from './hooks/use-price-flash';
import { sentimentColor } from '@/lib/colors';
import { TokenSelector } from './token-selector';

export function TokenHeader() {
	const { isExpanded, toggle } = useTokenHeaderExpand();
	const contentRef = useRef<HTMLDivElement>(null);
	const data = useTokenHeaderData();
	const selector = useTokenSelector();
	const priceRef = usePriceFlash(data.markPriceRaw);

	const changeColor = sentimentColor(data.change24hValue);

	return (
		<div className="relative shrink-0 border-b border-border">
			{/* Desktop */}
			<div className="relative hidden items-center lg:flex">
				<button
					type="button"
					onClick={selector.toggle}
					className="flex shrink-0 items-center gap-2 px-4 py-2 hover:bg-muted/50 transition-colors"
				>
					<span className="text-lg font-semibold">{data.symbol}</span>
					{data.dexName && (
						<span className="text-xs text-muted-foreground">
							{data.dexName}
						</span>
					)}
					<ChevronDown
						className={cn(
							'size-4 text-muted-foreground transition-transform duration-200',
							selector.isOpen && 'rotate-180',
						)}
					/>
				</button>

				<div className="flex items-center gap-8 overflow-x-auto text-sm no-scrollbar">
					<div className="flex shrink-0 flex-col whitespace-nowrap text-xs">
						<span className="text-muted-foreground">Mark</span>
						<span ref={priceRef} className="text-foreground">
							{data.markPrice}
						</span>
					</div>
					<div className="flex shrink-0 flex-col whitespace-nowrap text-xs">
						<span className="text-muted-foreground">Oracle</span>
						<span className="text-foreground">{data.oraclePrice}</span>
					</div>
					<div className="flex shrink-0 flex-col whitespace-nowrap text-xs">
						<span className="text-muted-foreground">24h Change</span>
						<span className={changeColor}>
							{data.changePx} / {data.change24h}
						</span>
					</div>
					<div className="flex shrink-0 flex-col whitespace-nowrap text-xs">
						<span className="text-muted-foreground">24h Vol</span>
						<span className="text-foreground">{data.volume24h}</span>
					</div>
					<div className="flex shrink-0 flex-col whitespace-nowrap text-xs">
						<span className="text-muted-foreground">Open Interest</span>
						<span className="text-foreground">{data.openInterest}</span>
					</div>
					<div className="flex shrink-0 flex-col whitespace-nowrap pr-8 text-xs">
						<span className="text-muted-foreground">Funding / Countdown</span>
						<span className={sentimentColor(0)}>
							{data.fundingRate} / {data.fundingInterval}
						</span>
					</div>
				</div>

				<div className="pointer-events-none absolute bottom-0 right-0 top-0 w-8 bg-linear-to-l from-background to-transparent" />
			</div>

			{/* Mobile */}
			<div className="lg:hidden">
				<div className="flex w-full items-center justify-between px-3 py-2">
					<button
						type="button"
						onClick={selector.toggle}
						className="flex items-center gap-2"
					>
						<span className="text-sm font-bold">{data.symbol}</span>
						{data.dexName && (
							<span className="text-[11px] text-muted-foreground">
								{data.dexName}
							</span>
						)}
						<ChevronDown className="size-4 text-muted-foreground" />
					</button>
					<button
						type="button"
						onClick={toggle}
						className="flex items-center gap-3"
					>
						<span className={changeColor}>{data.change24h}</span>
						<span className="text-sm font-medium">{data.markPrice}</span>
						<ChevronDown
							className={cn(
								'size-4 text-muted-foreground transition-transform duration-200',
								isExpanded && 'rotate-180',
							)}
						/>
					</button>
				</div>

				{isExpanded && !selector.isOpen && (
					<div
						ref={contentRef}
						className="overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out"
						style={{
							maxHeight: `${contentRef.current?.scrollHeight ?? 200}px`,
							opacity: 1,
						}}
					>
						<div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border px-3 py-2 text-xs">
							<div>
								<span className="text-muted-foreground">Oracle</span>
								<div className="text-foreground">{data.oraclePrice}</div>
							</div>
							<div className="text-right">
								<span className="text-muted-foreground">24h Volume</span>
								<div className="text-foreground">{data.volume24h}</div>
							</div>
							<div>
								<span className="text-muted-foreground">Open Interest</span>
								<div className="text-foreground">{data.openInterest}</div>
							</div>
							<div className="text-right">
								<span className="text-muted-foreground">Funding</span>
								<div className="text-foreground">
									{data.fundingRate} / {data.fundingInterval}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Token Selector Dropdown */}
			{selector.isOpen && (
				<TokenSelector
					onSelect={selector.selectToken}
					onClose={selector.close}
				/>
			)}
		</div>
	);
}
