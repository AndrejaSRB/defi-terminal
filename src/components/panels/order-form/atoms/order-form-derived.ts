import { atom } from 'jotai';
import { safeParseFloat } from '@/lib/numbers';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeAssetDataAtom } from '@/atoms/active-asset';
import { assetMetaAtom } from '@/atoms/asset-meta';
import { userMarginAtom } from '@/atoms/user/balances';
import { userPositionsAtom } from '@/atoms/user/positions';
import {
	orderTypeAtom,
	limitPriceAtom,
	sizeAtom,
	sizeDenomAtom,
	leverageAtom,
} from './order-form-atoms';

// ── Narrow selectors from global atoms ──────────────────────────────

export const availableMarginAtom = atom((get) => {
	const margin = get(userMarginAtom);
	return margin ? safeParseFloat(margin.withdrawable) : 0;
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
	return data ? safeParseFloat(data.markPrice) : 0;
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
	const margin = get(availableMarginAtom);
	const leverage = get(leverageAtom);
	const price = get(effectivePriceAtom);
	if (price <= 0) return 0;
	return (margin * leverage) / price;
});

export const sliderPercentDerivedAtom = atom((get) => {
	const sizeInCoin = get(sizeInCoinAtom);
	const maxSize = get(maxSizeInCoinAtom);
	if (maxSize <= 0) return 0;
	return Math.min(Math.round((sizeInCoin / maxSize) * 100), 100);
});
