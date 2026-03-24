export function safeParseFloat(
	value: string | number | undefined | null,
	fallback = 0,
): number {
	if (value == null || value === '') return fallback;
	const parsed = typeof value === 'number' ? value : parseFloat(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}
