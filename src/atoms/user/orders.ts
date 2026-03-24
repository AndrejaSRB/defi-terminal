import { atom } from 'jotai';
import type { OpenOrder } from '@/normalizer/types';

export const userOpenOrdersAtom = atom<OpenOrder[]>([]);
