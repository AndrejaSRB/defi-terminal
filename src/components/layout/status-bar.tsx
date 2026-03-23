import { useStatusBarData } from '@/hooks/use-status-bar-data';

const STATUS_COLORS = {
	online: 'bg-green-500',
	connecting: 'bg-yellow-500',
	offline: 'bg-red-500',
} as const;

export function StatusBar() {
	const { connectionStatus, dexName } = useStatusBarData();

	return (
		<div className="flex h-7 items-center justify-between border-t border-border px-3 text-xs text-muted-foreground">
			<div className="flex items-center gap-4 font-mono">
				<span>Open: $0</span>
				<span>Longs: $0</span>
				<span>Shorts: $0</span>
				<span>Orders: 0</span>
				<span>DEX: {dexName}</span>
			</div>
			<div className="flex items-center gap-2">
				<span
					className={`inline-block size-1.5 rounded-full ${STATUS_COLORS[connectionStatus]}`}
				/>
				<span className="capitalize font-mono">{connectionStatus}</span>
			</div>
		</div>
	);
}
