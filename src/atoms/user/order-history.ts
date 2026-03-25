import { atom } from 'jotai';
import type { HistoricalOrder } from '@/normalizer/types';

export const userOrderHistoryAtom = atom<HistoricalOrder[]>([]);
