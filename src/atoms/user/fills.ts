import { atom } from 'jotai';
import type { UserFill } from '@/normalizer/types';

export const userFillsAtom = atom<UserFill[]>([]);
