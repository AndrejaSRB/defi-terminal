/**
 * Extended account creation: EIP-712 signature + Stark key derivation.
 *
 * Step 1 of onboarding — user signs AccountCreation message,
 * then we derive L2 keys client-side (no API call).
 */

import type { SignTransactionFn } from '@/normalizer/onboarding';
import {
	deriveStarkKeyPair,
	signL2Registration,
	type StarkKeyPair,
	type L2Signature,
} from '../utils/stark-keys';
import { EXTENDED_CONFIG, ACCOUNT_CREATION_TYPES } from '../config';

export interface StarkKeyData {
	keyPair: StarkKeyPair;
	l2Signature: L2Signature;
}

/**
 * Sign the EIP-712 AccountCreation message.
 * This signature is used to deterministically derive Stark keys.
 */
export async function signAccountCreation(
	walletAddress: string,
	sign: SignTransactionFn,
): Promise<string> {
	const typedData = {
		domain: EXTENDED_CONFIG.SIGNING_DOMAIN,
		types: ACCOUNT_CREATION_TYPES,
		primaryType: 'AccountCreation' as const,
		message: {
			accountIndex: 0,
			wallet: walletAddress as `0x${string}`,
			tosAccepted: true,
		},
	};

	return sign(typedData);
}

/**
 * Derive Stark keypair and sign the L2 registration message.
 * Pure client-side crypto — no API call needed.
 */
export function deriveAndSignL2Keys(
	walletAddress: string,
	accountCreationSignature: string,
): StarkKeyData {
	const keyPair = deriveStarkKeyPair(accountCreationSignature);
	const l2Signature = signL2Registration(walletAddress, keyPair);

	return { keyPair, l2Signature };
}
