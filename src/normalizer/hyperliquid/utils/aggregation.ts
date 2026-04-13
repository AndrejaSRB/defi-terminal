import type { AggregationLevel } from '@/normalizer/types';

function formatTick(tick: number): string {
	if (tick >= 1) return tick.toFixed(0);
	const decimals = Math.max(0, -Math.floor(Math.log10(tick)));
	return tick.toFixed(decimals);
}

export function aggKey(level: AggregationLevel): string {
	if (level.nSigFigs === null) return 'raw';
	if (level.mantissa !== null) return `${level.nSigFigs}:${level.mantissa}`;
	return `${level.nSigFigs}`;
}

/**
 * Compute the aggregation levels for a given mid price.
 *
 * Raw tick = 10^(floor(log10(midPrice)) − 4), matching HL's
 * default 5-significant-figure precision.
 *
 * Memoized: levels only change when the price crosses an order of magnitude,
 * so the same array is returned for most price ticks. Prevents downstream
 * re-renders from new object references.
 */
let cachedRawTick = 0;
let cachedLevels: AggregationLevel[] = [];

export function getAggregationLevels(midPrice: number): AggregationLevel[] {
	if (midPrice <= 0)
		return [{ label: 'Raw', tickSize: 0, nSigFigs: null, mantissa: null }];

	const rawTick = Math.pow(10, Math.floor(Math.log10(midPrice)) - 4);

	if (rawTick === cachedRawTick && cachedLevels.length > 0) {
		return cachedLevels;
	}
	cachedRawTick = rawTick;

	cachedLevels = [
		{
			label: formatTick(rawTick),
			tickSize: rawTick,
			nSigFigs: null,
			mantissa: null,
		},
		{
			label: formatTick(rawTick * 2),
			tickSize: rawTick * 2,
			nSigFigs: 5,
			mantissa: 2,
		},
		{
			label: formatTick(rawTick * 5),
			tickSize: rawTick * 5,
			nSigFigs: 5,
			mantissa: 5,
		},
		{
			label: formatTick(rawTick * 10),
			tickSize: rawTick * 10,
			nSigFigs: 4,
			mantissa: null,
		},
		{
			label: formatTick(rawTick * 100),
			tickSize: rawTick * 100,
			nSigFigs: 3,
			mantissa: null,
		},
		{
			label: formatTick(rawTick * 1000),
			tickSize: rawTick * 1000,
			nSigFigs: 2,
			mantissa: null,
		},
	];
	return cachedLevels;
}
