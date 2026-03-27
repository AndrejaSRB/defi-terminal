import { atom } from 'jotai';
import { userTradingContextAtom } from '@/atoms/user/trading-context';

// ── Core form state ─────────────────────────────────────────────────
export const orderSideAtom = atom<'long' | 'short'>('long');
export const orderTypeAtom = atom<'market' | 'limit'>('market');
export const limitPriceAtom = atom<string>('');
export const sizeAtom = atom<string>('');
export const sizeDenomAtom = atom<'coin' | 'usd'>('usd');
export const sliderPercentAtom = atom<number>(0);
export const reduceOnlyAtom = atom<boolean>(false);

// ── Margin settings — default to server values, user can override ───
const marginModeOverrideAtom = atom<'cross' | 'isolated' | null>(null);
export const marginModeAtom = atom(
	(get) => {
		const override = get(marginModeOverrideAtom);
		if (override !== null) return override;
		return get(userTradingContextAtom)?.marginMode ?? 'cross';
	},
	(_get, set, value: 'cross' | 'isolated') => {
		set(marginModeOverrideAtom, value);
	},
);

const leverageOverrideAtom = atom<number | null>(null);
export const leverageAtom = atom(
	(get) => {
		const override = get(leverageOverrideAtom);
		if (override !== null) return override;
		return get(userTradingContextAtom)?.leverage ?? 20;
	},
	(_get, set, value: number) => {
		set(leverageOverrideAtom, value);
	},
);

// ── TP/SL state ─────────────────────────────────────────────────────
export const tpslEnabledAtom = atom<boolean>(false);
export const tpPriceAtom = atom<string>('');
export const tpGainAtom = atom<string>('');
export const tpToggleAtom = atom<'usd' | 'pct'>('pct');
export const tpSourceAtom = atom<'price' | 'gain'>('price');
export const slPriceAtom = atom<string>('');
export const slLossAtom = atom<string>('');
export const slToggleAtom = atom<'usd' | 'pct'>('pct');
export const slSourceAtom = atom<'price' | 'loss'>('price');

// Reset overrides on token switch — falls back to server values
export const resetMarginOverridesAtom = atom(null, (_get, set) => {
	set(leverageOverrideAtom, null);
	set(marginModeOverrideAtom, null);
});

// ── Slippage ────────────────────────────────────────────────────────
export const slippageAtom = atom<number>(8);

// ── Submission state ────────────────────────────────────────────────
export const isSubmittingAtom = atom<boolean>(false);
