export function sentimentColor(value: number): string {
	if (value > 0) return 'text-green-400';
	if (value < 0) return 'text-red-400';
	return 'text-foreground';
}
