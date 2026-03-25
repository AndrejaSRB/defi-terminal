export const COLOR_POSITIVE = 'text-green-400';
export const COLOR_NEGATIVE = 'text-red-400';
export const COLOR_NEUTRAL = 'text-foreground';

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
