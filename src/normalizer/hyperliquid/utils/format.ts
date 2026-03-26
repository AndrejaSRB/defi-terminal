/**
 * https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size
 *
 * Calculate how many decimals are allowed for a Hyperliquid perp price.
 * Uses the more restrictive of: decimal limit (6 - szDecimals) or sig figs limit (5).
 */
export function calculatePriceDecimals(
	value: number,
	szDecimals: number,
): number {
	if (!Number.isFinite(value) || value === 0) return 0;

	const MAX_DECIMALS = 6;
	const MAX_SIG_FIGS = 5;

	const maxPriceDecimals = Math.max(MAX_DECIMALS - szDecimals, 0);
	const magnitude = Math.floor(Math.log10(Math.abs(value)));
	const sigFigDecimals = Math.max(0, MAX_SIG_FIGS - magnitude - 1);

	return Math.min(maxPriceDecimals, sigFigDecimals);
}

/**
 * Truncate a price to the allowed number of decimals.
 * Returns a raw number for use in order placement.
 */
export function truncatePrice(value: number, szDecimals: number): number {
	if (!Number.isFinite(value)) return 0;

	const decimals = calculatePriceDecimals(value, szDecimals);
	const multiplier = 10 ** decimals;
	return Math.trunc(value * multiplier) / multiplier;
}

/**
 * Format a price with thousand separators and correct decimal precision.
 * Uses Math.round to match Hyperliquid's display behavior.
 */
export function formatPrice(value: number, szDecimals: number): string {
	if (!Number.isFinite(value)) return '--';

	const decimals = calculatePriceDecimals(value, szDecimals);
	const multiplier = 10 ** decimals;
	const rounded = Math.round(value * multiplier) / multiplier;

	return rounded.toLocaleString('en-US', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
}

/**
 * Format a size/quantity truncated to szDecimals places.
 */
export function formatSize(value: number, szDecimals: number): string {
	if (!Number.isFinite(value)) return '--';

	const multiplier = 10 ** szDecimals;
	// Round instead of trunc to avoid floating point precision loss
	// e.g., 0.00015 * 100000 = 14.999... → Math.round = 15
	const rounded = Math.round(value * multiplier) / multiplier;

	return rounded.toFixed(szDecimals);
}
