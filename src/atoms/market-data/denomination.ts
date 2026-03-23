import { atom } from 'jotai';

export type Denomination = 'token' | 'usd';

export const denominationAtom = atom<Denomination>('token');
