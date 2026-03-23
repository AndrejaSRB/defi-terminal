export type ActiveAssetCtx = {
	coin: string;
	ctx: {
		funding: string;
		openInterest: string;
		prevDayPx: string;
		dayNtlVlm: string;
		premium: string;
		oraclePx: string;
		markPx: string;
		midPx: string;
		impactPxs: string[];
		dayBaseVlm: string;
	};
};
