import type { AggregationLevel } from '@/normalizer/types';

function formatTick(tick: number): string {
	if (tick >= 1) return tick.toFixed(0);
	const decimals = Math.max(0, -Math.floor(Math.log10(tick)));
	return tick.toFixed(decimals);
}

/**
 * Compute aggregation levels matching Extended's UI.
 *
 * Extended uses: 1×, 5×, 10×, 100×, 1000× of the base tick.
 * Base tick = 10^(floor(log10(midPrice)) - 4), giving ~5 sig figs.
 */
export function getAggregationLevels(midPrice: number): AggregationLevel[] {
	if (midPrice <= 0)
		return [{ label: '0.01', tickSize: 0.01, nSigFigs: null, mantissa: null }];

	const baseTick = 10 ** (Math.floor(Math.log10(midPrice)) - 4);
	const multipliers = [1, 5, 10, 100, 1000];

	return multipliers.map((mult) => {
		const tickSize = baseTick * mult;
		return {
			label: formatTick(tickSize),
			tickSize,
			nSigFigs: null,
			mantissa: null,
		};
	});
}
