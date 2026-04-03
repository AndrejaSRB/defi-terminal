import { atom } from 'jotai';
import { safeParseFloat } from '@/lib/numbers';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeAssetDataAtom } from '@/atoms/active-asset';
import { allAssetCtxsAtom } from '@/atoms/all-asset-ctxs';
import { assetMetaAtom } from '@/atoms/asset-meta';
import { activeNormalizerAtom } from '@/atoms/dex';
import { pricesAtom } from '@/atoms/prices';
import { userPositionsAtom } from '@/atoms/user/positions';
import { userTradingContextAtom } from '@/atoms/user/trading-context';
import {
	orderSideAtom,
	orderTypeAtom,
	limitPriceAtom,
	sizeAtom,
	sizeDenomAtom,
	leverageAtom,
	tpPriceAtom,
	tpGainAtom,
	tpToggleAtom,
	tpSourceAtom,
	slPriceAtom,
	slLossAtom,
	slToggleAtom,
	slSourceAtom,
} from './order-form-atoms';

// ── Narrow selectors from global atoms ──────────────────────────────

export const availableToTradeAtom = atom((get) => {
	const ctx = get(userTradingContextAtom);
	if (!ctx) return 0;
	const side = get(orderSideAtom);
	return side === 'long' ? ctx.availableToTradeBuy : ctx.availableToTradeSell;
});

export const maxTradeSizeAtom = atom((get) => {
	const ctx = get(userTradingContextAtom);
	if (!ctx) return 0;
	const side = get(orderSideAtom);
	return side === 'long' ? ctx.maxTradeSzBuy : ctx.maxTradeSzSell;
});

export const serverLeverageAtom = atom((get) => {
	const ctx = get(userTradingContextAtom);
	return ctx?.leverage ?? null;
});

export const serverMarginModeAtom = atom((get) => {
	const ctx = get(userTradingContextAtom);
	return ctx?.marginMode ?? null;
});

export const activePositionAtom = atom((get) => {
	const token = get(activeTokenAtom);
	const positions = get(userPositionsAtom);
	return positions.find((position) => position.coin === token) ?? null;
});

export const activeMetaAtom = atom((get) => {
	const token = get(activeTokenAtom);
	const meta = get(assetMetaAtom);
	return meta.get(token) ?? null;
});

export const markPriceAtom = atom((get) => {
	const data = get(activeAssetDataAtom);
	if (data) return safeParseFloat(data.markPrice);

	// Fallback for DEXes without per-token activeAsset WS (e.g. Extended)
	const token = get(activeTokenAtom);
	const prices = get(pricesAtom);
	if (prices[token]) return safeParseFloat(prices[token]);

	const ctx = get(allAssetCtxsAtom).get(token);
	return ctx ? safeParseFloat(ctx.markPrice) : 0;
});

// Fast mid price from allMids WS (ticks more frequently than activeAssetCtx)
export const liveMidPriceAtom = atom((get) => {
	const token = get(activeTokenAtom);
	const prices = get(pricesAtom);
	const mid = prices[token];
	return mid ? safeParseFloat(mid) : get(markPriceAtom);
});

export const priceDecimalsAtom = atom((get) => {
	const normalizer = get(activeNormalizerAtom);
	const mark = get(markPriceAtom);
	const token = get(activeTokenAtom);
	if (mark <= 0) return 2;
	return normalizer.calculatePriceDecimals(mark, token);
});

// ── Computed from form atoms ────────────────────────────────────────

export const effectivePriceAtom = atom((get) => {
	const type = get(orderTypeAtom);
	if (type === 'market') return get(markPriceAtom);
	return safeParseFloat(get(limitPriceAtom));
});

export const sizeInCoinAtom = atom((get) => {
	const raw = safeParseFloat(get(sizeAtom));
	const denom = get(sizeDenomAtom);
	if (denom === 'coin') return raw;
	const price = get(effectivePriceAtom);
	return price > 0 ? raw / price : 0;
});

export const orderValueAtom = atom((get) => {
	const sizeInCoin = get(sizeInCoinAtom);
	const price = get(effectivePriceAtom);
	return sizeInCoin * price;
});

export const marginRequiredAtom = atom((get) => {
	const orderValue = get(orderValueAtom);
	const leverage = get(leverageAtom);
	return leverage > 0 ? orderValue / leverage : 0;
});

export const maxSizeInCoinAtom = atom((get) => {
	const available = get(availableToTradeAtom);
	const leverage = get(leverageAtom);
	const price = get(effectivePriceAtom);
	if (price <= 0) return 0;
	// available = margin, leveraged buying power = margin × leverage
	return (available * leverage) / price;
});

export const estLiquidationPriceAtom = atom((get) => {
	const normalizer = get(activeNormalizerAtom);
	if (!normalizer.estimateLiquidationPrice) return 0;

	const side = get(orderSideAtom);
	const price = get(effectivePriceAtom);
	const leverage = get(leverageAtom);
	const sizeInCoin = get(sizeInCoinAtom);
	if (price <= 0 || leverage <= 0 || sizeInCoin <= 0) return 0;

	return normalizer.estimateLiquidationPrice({
		side,
		entryPrice: price,
		leverage,
		sizeInCoin,
	});
});

export const sliderPercentDerivedAtom = atom((get) => {
	const sizeInCoin = get(sizeInCoinAtom);
	const maxSize = get(maxSizeInCoinAtom);
	if (maxSize <= 0) return 0;
	return Math.min(Math.round((sizeInCoin / maxSize) * 100), 100);
});

export const liveTpPriceAtom = atom((get) => {
	const source = get(tpSourceAtom);
	// User typed a price directly — return it as-is
	if (source === 'price') return get(tpPriceAtom);

	// User typed gain % — recompute price from entry (limit price or mark)
	const entry = get(effectivePriceAtom);
	const leverage = get(leverageAtom);
	const side = get(orderSideAtom);
	const toggle = get(tpToggleAtom);
	const gain = safeParseFloat(get(tpGainAtom));
	if (entry <= 0 || gain === 0) return get(tpPriceAtom);

	const decimals = get(priceDecimalsAtom);
	let tp: number;
	if (toggle === 'pct') {
		// targetPrice = entry × (1 + adjustedPct / (leverage × 100))
		const adjusted = side === 'long' ? gain : -gain;
		tp = entry * (1 + adjusted / (leverage * 100));
	} else {
		tp = side === 'long' ? entry + gain : entry - gain;
	}
	return tp > 0 ? tp.toFixed(decimals) : '';
});

export const liveSlPriceAtom = atom((get) => {
	const source = get(slSourceAtom);
	if (source === 'price') return get(slPriceAtom);

	const entry = get(effectivePriceAtom);
	const leverage = get(leverageAtom);
	const side = get(orderSideAtom);
	const toggle = get(slToggleAtom);
	const loss = safeParseFloat(get(slLossAtom));
	if (entry <= 0 || loss === 0) return get(slPriceAtom);

	const decimals = get(priceDecimalsAtom);
	let sl: number;
	if (toggle === 'pct') {
		// SL inverts the sign: long SL is below entry
		const adjusted = side === 'long' ? -loss : loss;
		sl = entry * (1 + adjusted / (leverage * 100));
	} else {
		sl = side === 'long' ? entry - loss : entry + loss;
	}
	return sl > 0 ? sl.toFixed(decimals) : '';
});

export const liveTpGainAtom = atom((get) => {
	const source = get(tpSourceAtom);
	// User typed gain directly — return it as-is
	if (source === 'gain') return get(tpGainAtom);

	// User typed price — recompute leveraged gain from price vs entry
	const entry = get(effectivePriceAtom);
	const leverage = get(leverageAtom);
	const side = get(orderSideAtom);
	const toggle = get(tpToggleAtom);
	const tp = safeParseFloat(get(tpPriceAtom));
	if (entry <= 0 || tp <= 0) return get(tpGainAtom);

	if (toggle === 'pct') {
		// pct = ((tp - entry) / entry) × 100 × leverage, negated for shorts
		const rawPct = ((tp - entry) / entry) * 100 * leverage;
		return (side === 'long' ? rawPct : -rawPct).toFixed(2);
	}
	const usd = side === 'long' ? tp - entry : entry - tp;
	return usd.toFixed(2);
});

export const liveSlLossAtom = atom((get) => {
	const source = get(slSourceAtom);
	if (source === 'loss') return get(slLossAtom);

	const entry = get(effectivePriceAtom);
	const leverage = get(leverageAtom);
	const side = get(orderSideAtom);
	const toggle = get(slToggleAtom);
	const sl = safeParseFloat(get(slPriceAtom));
	if (entry <= 0 || sl <= 0) return get(slLossAtom);

	if (toggle === 'pct') {
		// pct = ((entry - sl) / entry) × 100 × leverage, negated for shorts
		const rawPct = ((entry - sl) / entry) * 100 * leverage;
		return (side === 'long' ? rawPct : -rawPct).toFixed(2);
	}
	const usd = side === 'long' ? entry - sl : sl - entry;
	return usd.toFixed(2);
});
