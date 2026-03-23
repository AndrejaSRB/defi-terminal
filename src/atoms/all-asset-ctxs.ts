import { atom } from 'jotai';
import type { ActiveAssetData } from '@/normalizer/types';

export const allAssetCtxsAtom = atom<Map<string, ActiveAssetData>>(new Map());
