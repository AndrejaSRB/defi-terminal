import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTokenHeaderExpand } from '@/hooks/use-token-header-expand';

export function TokenHeader() {
	const { isExpanded, toggle } = useTokenHeaderExpand();
	const contentRef = useRef<HTMLDivElement>(null);

	return (
		<div className="shrink-0 border-b border-border">
			{/* Desktop */}
			<div className="relative hidden h-12 items-center lg:flex">
				<div className="flex shrink-0 items-center gap-2 px-3">
					<span className="text-sm font-bold">BTC-USDC</span>
				</div>

				<div className="flex items-center gap-5 overflow-x-auto text-xs scrollbar-none">
					<div className="shrink-0 whitespace-nowrap">
						<span className="text-muted-foreground">Mark</span>
						<span className="ml-1.5 text-foreground">--</span>
					</div>
					<div className="shrink-0 whitespace-nowrap">
						<span className="text-muted-foreground">Oracle</span>
						<span className="ml-1.5 text-foreground">--</span>
					</div>
					<div className="shrink-0 whitespace-nowrap">
						<span className="text-muted-foreground">24h Change</span>
						<span className="ml-1.5 text-foreground">--</span>
					</div>
					<div className="shrink-0 whitespace-nowrap">
						<span className="text-muted-foreground">24h Vol</span>
						<span className="ml-1.5 text-foreground">--</span>
					</div>
					<div className="shrink-0 whitespace-nowrap">
						<span className="text-muted-foreground">Open Interest</span>
						<span className="ml-1.5 text-foreground">--</span>
					</div>
					<div className="shrink-0 whitespace-nowrap pr-6">
						<span className="text-muted-foreground">Funding</span>
						<span className="ml-1.5 text-foreground">--</span>
					</div>
				</div>

				<div className="pointer-events-none absolute bottom-0 right-0 top-0 w-8 bg-linear-to-l from-background to-transparent" />
			</div>

			{/* Mobile */}
			<div className="lg:hidden">
				<button
					type="button"
					onClick={toggle}
					className="flex w-full items-center justify-between px-3 py-2"
				>
					<div className="flex items-center gap-2">
						<span className="text-sm font-bold">BTC</span>
						<ChevronDown className="size-4 text-muted-foreground" />
					</div>
					<div className="flex items-center gap-3">
						<span className="text-xs text-green-400">+3.04%</span>
						<span className="text-sm font-medium">--</span>
						<ChevronDown
							className={`size-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
						/>
					</div>
				</button>

				<div
					ref={contentRef}
					className="overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out"
					style={{
						maxHeight: isExpanded
							? `${contentRef.current?.scrollHeight ?? 200}px`
							: '0px',
						opacity: isExpanded ? 1 : 0,
					}}
				>
					<div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border px-3 py-2 text-xs">
						<div>
							<span className="text-muted-foreground">Oracle</span>
							<div className="text-foreground">--</div>
						</div>
						<div className="text-right">
							<span className="text-muted-foreground">24h Volume</span>
							<div className="text-foreground">--</div>
						</div>
						<div>
							<span className="text-muted-foreground">Open Interest</span>
							<div className="text-foreground">--</div>
						</div>
						<div className="text-right">
							<span className="text-muted-foreground">
								Next Funding / Countdown
							</span>
							<div className="text-foreground">--</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
