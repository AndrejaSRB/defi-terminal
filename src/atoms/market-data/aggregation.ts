import { atom } from 'jotai';
import type { AggregationLevel } from '@/normalizer/types';

export const activeAggregationAtom = atom<AggregationLevel | null>(null);
