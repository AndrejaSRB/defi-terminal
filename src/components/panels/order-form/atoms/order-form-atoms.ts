import { atom } from 'jotai';

// ── Core form state ─────────────────────────────────────────────────
export const orderSideAtom = atom<'long' | 'short'>('long');
export const orderTypeAtom = atom<'market' | 'limit'>('market');
export const limitPriceAtom = atom<string>('');
export const sizeAtom = atom<string>('');
export const sizeDenomAtom = atom<'coin' | 'usd'>('usd');
export const sliderPercentAtom = atom<number>(0);
export const reduceOnlyAtom = atom<boolean>(false);

// ── Margin settings (placeholders — modals will set these later) ────
export const marginModeAtom = atom<'cross' | 'isolated'>('cross');
export const leverageAtom = atom<number>(20);

// ── TP/SL state ─────────────────────────────────────────────────────
export const tpslEnabledAtom = atom<boolean>(false);
export const tpPriceAtom = atom<string>('');
export const tpGainAtom = atom<string>('');
export const tpToggleAtom = atom<'usd' | 'pct'>('pct');
export const slPriceAtom = atom<string>('');
export const slLossAtom = atom<string>('');
export const slToggleAtom = atom<'usd' | 'pct'>('pct');
