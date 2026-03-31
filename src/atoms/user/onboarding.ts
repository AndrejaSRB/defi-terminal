import { atom } from 'jotai';
import { safeParseFloat } from '@/lib/numbers';
import { activeDexOnboardingAtom, activeNormalizerAtom } from '@/atoms/dex';
import { userMarginAtom, userSpotBalancesAtom } from '@/atoms/user/balances';
import type { OnboardingStep } from '@/normalizer/onboarding';

// Wallet address — set by a Tier 1 hook from Privy auth
export const walletAddressAtom = atom<string | null>(null);

// Increment to force onboarding recomputation after agent creation
export const onboardingVersionAtom = atom(0);

// True once WS has delivered balance data — prevents flash of wrong onboarding state
export const isOnboardingDataReadyAtom = atom((get) => {
	const address = get(walletAddressAtom);
	if (!address) return false;

	// DEXes without user WS channels (e.g. Extended) are ready once wallet is connected
	const normalizer = get(activeNormalizerAtom);
	if (!normalizer.channels.userPositions) return true;

	// Wait for at least one WS delivery of balance data
	return get(userMarginAtom) !== null;
});

export const onboardingStepsAtom = atom<OnboardingStep[]>((get) => {
	const address = get(walletAddressAtom);
	if (!address) return [];

	// Don't compute steps until WS data has arrived
	if (!get(isOnboardingDataReadyAtom)) return [];

	// Subscribe to version changes so we recompute after agent creation
	get(onboardingVersionAtom);

	const onboarding = get(activeDexOnboardingAtom);
	if (!onboarding) return [];

	const margin = get(userMarginAtom);
	const spotBalances = get(userSpotBalancesAtom);

	const rawUsd = margin ? safeParseFloat(margin.totalRawUsd) : 0;
	const accountValue = margin ? safeParseFloat(margin.accountValue) : 0;
	const spotValue = spotBalances.reduce(
		(sum, balance) => sum + balance.usdValue,
		0,
	);

	return onboarding.getSteps({
		walletAddress: address,
		totalRawUsd: rawUsd > 0 ? rawUsd : accountValue + spotValue,
	});
});

// First pending step that blocks trading — null means all ready
export const onboardingBlockerAtom = atom((get) => {
	const steps = get(onboardingStepsAtom);
	return steps.find((step) => step.status === 'pending') ?? null;
});
