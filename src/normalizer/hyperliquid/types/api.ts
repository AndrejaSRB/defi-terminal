// ── allPerpMetas response ────────────────────────────────────────────

export interface HlPerpMeta {
	name: string;
	szDecimals: number;
	maxLeverage: number;
	marginTableId: number;
	onlyIsolated?: boolean;
	isDelisted?: boolean;
	marginMode?: string;
	growthMode?: string;
	lastGrowthModeChangeTime?: string;
}

export interface HlPerpMetaGroup {
	universe: HlPerpMeta[];
	marginTables: [
		number,
		{
			description: string;
			marginTiers: { lowerBound: string; maxLeverage: number }[];
		},
	][];
	collateralToken: number;
}

export type HlAllPerpMetasResponse = HlPerpMetaGroup[];

// ── metaAndAssetCtxs response ───────────────────────────────────────

export interface HlRestAssetCtx {
	funding: string;
	openInterest: string;
	prevDayPx: string;
	dayNtlVlm: string;
	premium: string;
	oraclePx: string;
	markPx: string;
	midPx?: string;
	impactPxs?: string[];
	dayBaseVlm?: string;
}

export type HlMetaAndAssetCtxsResponse = [HlPerpMetaGroup, HlRestAssetCtx[]];

// ── allDexsAssetCtxs WS response ────────────────────────────────────

export interface HlWsPerpsAssetCtx {
	dayNtlVlm: number;
	prevDayPx: number;
	markPx: number;
	midPx?: number;
	funding: number;
	openInterest: number;
	oraclePx: number;
}

export interface HlWsAllDexsAssetCtxs {
	ctxs: [string, HlWsPerpsAssetCtx[]][];
}
