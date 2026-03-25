import { atom } from 'jotai';
import type { OpenOrder } from '@/normalizer/types';

export const userOpenOrdersAtom = atom<OpenOrder[]>([]);
export const userOpenOrdersCountAtom = atom(
	(get) => get(userOpenOrdersAtom).length,
);
