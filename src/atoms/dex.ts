import { atom } from 'jotai';
import type { DexNormalizer } from '@/normalizer/normalizer';
import { hyperliquidNormalizer } from '@/normalizer/hyperliquid/hyperliquid';

export const activeNormalizerAtom = atom<DexNormalizer>(hyperliquidNormalizer);
