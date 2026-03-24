import { cn } from '@/lib/utils';
import { sentimentColor } from '@/lib/colors';
import { useStatusBarData } from './use-status-bar-data';

const STATUS_COLORS = {
	online: 'bg-green-500',
	connecting: 'bg-yellow-500',
	offline: 'bg-red-500',
} as const;

export function StatusBar() {
	const {
		connectionStatus,
		dexName,
		totalOpen,
		totalLongs,
		totalShorts,
		totalPnl,
		totalPnlValue,
		orderCount,
	} = useStatusBarData();

	return (
		<div className="flex h-7 items-center justify-between border-t border-border px-3 text-xs text-muted-foreground">
			<div className="flex items-center gap-4 font-mono">
				<span className="hidden lg:inline">Open: {totalOpen}</span>
				<span className="hidden lg:inline">Longs: {totalLongs}</span>
				<span className="hidden lg:inline">Shorts: {totalShorts}</span>
				<span className={cn('hidden lg:inline', sentimentColor(totalPnlValue))}>
					UPnL: {totalPnl}
				</span>
				<span className="hidden lg:inline">Orders: {orderCount}</span>
				<span>DEX: {dexName}</span>
			</div>
			<div className="flex items-center gap-2">
				<span
					className={cn(
						'inline-block size-1.5 rounded-full',
						STATUS_COLORS[connectionStatus],
					)}
				/>
				<span className="font-mono capitalize">{connectionStatus}</span>
			</div>
		</div>
	);
}
