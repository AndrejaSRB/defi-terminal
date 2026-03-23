export function StatusBar() {
	return (
		<div className="flex h-7 items-center justify-between border-t border-border px-3 text-xs text-muted-foreground">
			<div className="flex items-center gap-4">
				<span>Open: $0</span>
				<span>Longs: $0</span>
				<span>Shorts: $0</span>
				<span>Orders: 0</span>
				<span>DEX: HyperLiquid</span>
			</div>
			<div className="flex items-center gap-2">
				<span className="inline-block size-1.5 rounded-full bg-green-500" />
				<span>Online</span>
			</div>
		</div>
	);
}
