/**
 * Extended price formatting uses dynamic significant figures.
 *
 * Price: sig-fig based, capped at collateralAssetPrecision (typically 6)
 * Size: fixed decimals from assetPrecision per market
 *
 * Prices are truncated (not rounded) to match Extended's UI.
 */

const MAX_SIG_FIGS = 5;
const DEFAULT_MAX_DECIMALS = 6;

/**
 * Calculate number of decimal places for a price value.
 * Uses significant figures approach capped at maxDecimals.
 */
export function calculatePriceDecimals(
	value: number,
	maxDecimals = DEFAULT_MAX_DECIMALS,
): number {
	if (!Number.isFinite(value) || value === 0) return 2;

	const magnitude = Math.floor(Math.log10(Math.abs(value)));
	const decimals = Math.max(0, MAX_SIG_FIGS - magnitude - 1);
	return Math.min(decimals, maxDecimals);
}

/**
 * Format a price for display. Truncates then formats with locale separators.
 */
export function formatPrice(
	value: number,
	maxDecimals = DEFAULT_MAX_DECIMALS,
): string {
	const decimals = calculatePriceDecimals(value, maxDecimals);
	const truncated = Math.trunc(value * 10 ** decimals) / 10 ** decimals;
	return truncated.toLocaleString('en-US', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
}

/**
 * Format a size using fixed asset precision.
 */
export function formatSize(value: number, precision: number): string {
	return value.toLocaleString('en-US', {
		minimumFractionDigits: precision,
		maximumFractionDigits: precision,
	});
}
