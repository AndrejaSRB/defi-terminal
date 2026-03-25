import { atom } from 'jotai';
import type { Position } from '@/normalizer/types';

export const userPositionsAtom = atom<Position[]>([]);
export const userPositionsCountAtom = atom(
	(get) => get(userPositionsAtom).length,
);
