import { atom } from 'jotai';
import type { MarginSummary, UserBalance } from '@/normalizer/types';

export const userPerpsBalancesAtom = atom<UserBalance[]>([]);
export const userSpotBalancesAtom = atom<UserBalance[]>([]);
export const userMarginAtom = atom<MarginSummary | null>(null);
