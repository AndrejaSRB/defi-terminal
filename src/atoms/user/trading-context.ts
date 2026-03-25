import { atom } from 'jotai';
import type { UserTradingContext } from '@/normalizer/types';

export const userTradingContextAtom = atom<UserTradingContext | null>(null);
