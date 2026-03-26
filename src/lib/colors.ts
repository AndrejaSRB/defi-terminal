// Text colors
export const COLOR_POSITIVE = 'text-green-400';
export const COLOR_NEGATIVE = 'text-red-400';
export const COLOR_NEUTRAL = 'text-foreground';

// Buy/Sell colors — single source of truth
export const BUY_COLOR = 'bg-green-600';
export const SELL_COLOR = 'bg-red-600';
export const BUY_BG = `${BUY_COLOR} text-white hover:bg-green-600/60`;
export const SELL_BG = `${SELL_COLOR} text-white hover:bg-red-600/60`;
export const BUY_GLOW = 'shadow-[0_0_8px_rgba(34,197,94,0.3)]';
export const SELL_GLOW = 'shadow-[0_0_8px_rgba(239,68,68,0.3)]';

export function sentimentColor(value: number): string {
	if (value > 0) return COLOR_POSITIVE;
	if (value < 0) return COLOR_NEGATIVE;
	return COLOR_NEUTRAL;
}

export function directionColor(dir: string): string {
	if (dir === 'Open Long' || dir === 'Close Short') return COLOR_POSITIVE;
	if (dir === 'Open Short' || dir === 'Close Long') return COLOR_NEGATIVE;
	return COLOR_NEUTRAL;
}
