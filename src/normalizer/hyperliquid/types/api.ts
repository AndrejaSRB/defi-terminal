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

// ── User Fills ───────────────────────────────────────────────────────

export interface HlUserFill {
	coin: string;
	px: string;
	sz: string;
	side: 'B' | 'A';
	time: number;
	dir: string;
	closedPnl: string;
	hash: string;
	oid: number;
	crossed: boolean;
	fee: string;
	tid: number;
	feeToken: string;
}

// ── Spot State ───────────────────────────────────────────────────────

// ── Historical Orders ────────────────────────────────────────────────

export interface HlHistoricalOrder {
	order: {
		coin: string;
		side: 'B' | 'A';
		limitPx: string;
		sz: string;
		oid: number;
		timestamp: number;
		triggerCondition: string;
		isTrigger: boolean;
		triggerPx: string;
		children: unknown[];
		isPositionTpsl: boolean;
		reduceOnly: boolean;
		orderType: string;
		origSz: string;
		tif: string | null;
		cloid: string | null;
	};
	status: string;
	statusTimestamp: number;
}

// ── Funding Payments ─────────────────────────────────────────────────

export interface HlFundingPayment {
	time: number;
	coin: string;
	usdc: string;
	szi: string;
	fundingRate: string;
	nSamples: number | null;
}

// ── Spot State ───────────────────────────────────────────────────────

export interface HlSpotBalance {
	coin: string;
	token: number;
	total: string;
	hold: string;
	entryNtl: string;
}
