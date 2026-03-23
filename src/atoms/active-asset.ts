import { atom } from 'jotai';
import type { ActiveAssetData } from '@/normalizer/types';

export const activeAssetDataAtom = atom<ActiveAssetData | null>(null);
