export function ChartPanel() {
	return (
		<div className="flex h-full flex-col">
			<div className="flex h-8 items-center gap-2 border-b border-border px-3 text-xs text-muted-foreground">
				<span className="cursor-pointer hover:text-foreground">1h</span>
				<span className="cursor-pointer hover:text-foreground">4h</span>
				<span className="cursor-pointer hover:text-foreground">D</span>
				<span className="cursor-pointer text-foreground">5m</span>
			</div>
			<div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
				Chart
			</div>
		</div>
	);
}
