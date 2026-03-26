import { atom } from 'jotai';
import type { DexNormalizer } from '@/normalizer/normalizer';
import type { DexOnboarding } from '@/normalizer/onboarding';
import { hyperliquidNormalizer } from '@/normalizer/hyperliquid/hyperliquid';
import { hyperliquidOnboarding } from '@/normalizer/hyperliquid/onboarding';

export const activeNormalizerAtom = atom<DexNormalizer>(hyperliquidNormalizer);
export const activeDexOnboardingAtom = atom<DexOnboarding>(
	hyperliquidOnboarding,
);
