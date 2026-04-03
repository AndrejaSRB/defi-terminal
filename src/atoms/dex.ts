import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { DexNormalizer } from '@/normalizer/normalizer';
import type { DexOnboarding } from '@/normalizer/onboarding';
import type { DexExchange } from '@/normalizer/exchange';
import { hyperliquidNormalizer } from '@/normalizer/hyperliquid/hyperliquid';
import { hyperliquidOnboarding } from '@/normalizer/hyperliquid/onboarding';
import { hyperliquidExchange } from '@/normalizer/hyperliquid/exchange';
import { extendedNormalizer } from '@/normalizer/extended/extended';
import { extendedOnboarding } from '@/normalizer/extended/onboarding';
import { extendedExchange } from '@/normalizer/extended/exchange';

// ── DEX Registry ──

export interface DexConfig {
	id: string;
	name: string;
	normalizer: DexNormalizer;
	onboarding: DexOnboarding | null;
	exchange: DexExchange | null;
}

export const DEX_REGISTRY: DexConfig[] = [
	{
		id: 'hyperliquid',
		name: 'HyperLiquid',
		normalizer: hyperliquidNormalizer,
		onboarding: hyperliquidOnboarding,
		exchange: hyperliquidExchange,
	},
	{
		id: 'extended',
		name: 'Extended',
		normalizer: extendedNormalizer,
		onboarding: extendedOnboarding,
		exchange: extendedExchange,
	},
];

// ── Active DEX Atoms ──

export const activeDexIdAtom = atomWithStorage<string>(
	'active-dex',
	'hyperliquid',
);

export const activeDexConfigAtom = atom((get) => {
	const id = get(activeDexIdAtom);
	return DEX_REGISTRY.find((dex) => dex.id === id) ?? DEX_REGISTRY[0];
});

export const activeNormalizerAtom = atom(
	(get) => get(activeDexConfigAtom).normalizer,
);

export const activeDexOnboardingAtom = atom<DexOnboarding | null>((get) => {
	return get(activeDexConfigAtom).onboarding;
});

export const activeDexExchangeAtom = atom<DexExchange | null>((get) => {
	return get(activeDexConfigAtom).exchange;
});
