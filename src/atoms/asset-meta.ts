import { atom } from 'jotai';
import type { AssetMeta } from '@/normalizer/types';

export const assetMetaAtom = atom<Map<string, AssetMeta>>(new Map());
