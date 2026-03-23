import { atom } from 'jotai';
import type { Prices } from '@/normalizer/types';

export const pricesAtom = atom<Prices>({});
