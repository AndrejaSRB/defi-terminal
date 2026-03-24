import type { ResolutionString } from '@charting_library/datafeed-api';

const RESOLUTION_TO_HL: Record<string, string> = {
	'1': '1m',
	'3': '3m',
	'5': '5m',
	'15': '15m',
	'30': '30m',
	'60': '1h',
	'120': '2h',
	'240': '4h',
	'480': '8h',
	'720': '12h',
	'1D': '1d',
	'3D': '3d',
	'1W': '1w',
	'1M': '1M',
};

export const SUPPORTED_RESOLUTIONS = Object.keys(
	RESOLUTION_TO_HL,
) as ResolutionString[];

export function tvResolutionToHlInterval(resolution: string): string {
	const interval = RESOLUTION_TO_HL[resolution];
	if (!interval) throw new Error(`Unsupported resolution: ${resolution}`);
	return interval;
}
