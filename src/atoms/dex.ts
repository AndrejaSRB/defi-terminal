import { atom } from 'jotai';
import type { DexNormalizer } from '@/normalizer/normalizer';
import type { DexOnboarding } from '@/normalizer/onboarding';
import type { DexExchange } from '@/normalizer/exchange';
import { hyperliquidNormalizer } from '@/normalizer/hyperliquid/hyperliquid';
import { hyperliquidOnboarding } from '@/normalizer/hyperliquid/onboarding';
import { hyperliquidExchange } from '@/normalizer/hyperliquid/exchange';

export const activeNormalizerAtom = atom<DexNormalizer>(hyperliquidNormalizer);
export const activeDexOnboardingAtom = atom<DexOnboarding>(
	hyperliquidOnboarding,
);
export const activeDexExchangeAtom = atom<DexExchange>(hyperliquidExchange);
