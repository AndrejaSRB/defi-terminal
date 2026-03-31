/**
 * Stark key derivation and signing for Extended DEX.
 *
 * Implements the same flow as Extended's Python SDK:
 * 1. EIP-712 AccountCreation signature → extract r → grindKey → Stark keypair
 * 2. pedersen(walletAddress, publicKey) → hash → STARK sign → l2Signature
 *
 * Pure crypto — no framework dependencies.
 * @see https://github.com/x10xchange/python_sdk/blob/starknet/x10/perpetual/user_client/onboarding.py
 */

import {
	grindKey,
	getStarkKey,
	pedersen,
	sign as starkSign,
} from '@scure/starknet';

export interface StarkKeyPair {
	/** Hex string with 0x prefix */
	privateKey: string;
	/** Hex string with 0x prefix */
	publicKey: string;
}

export interface L2Signature {
	/** Hex string with 0x prefix */
	r: string;
	/** Hex string with 0x prefix */
	s: string;
}

/**
 * Derive a Stark keypair from an EIP-712 AccountCreation signature.
 *
 * The Python SDK uses `generate_keypair_from_eth_signature(signature.hex())`
 * which internally extracts the `r` component and applies grindKey.
 */
export function deriveStarkKeyPair(
	accountCreationSignature: string,
): StarkKeyPair {
	// Strip 0x prefix if present
	const sigHex = accountCreationSignature.startsWith('0x')
		? accountCreationSignature.slice(2)
		: accountCreationSignature;

	// Extract r component (first 32 bytes = 64 hex chars)
	const rHex = sigHex.slice(0, 64);

	// grindKey derives a valid Stark private key from seed (returns hex without 0x)
	const privateKeyHex = grindKey(rHex);

	// getStarkKey derives public key (returns hex with 0x prefix)
	const publicKeyHex = getStarkKey(privateKeyHex);

	return {
		privateKey: `0x${privateKeyHex}`,
		publicKey: publicKeyHex,
	};
}

/**
 * Sign the L2 registration message for Extended onboarding.
 *
 * Computes pedersen(walletAddress, publicKey) and signs with the Stark private key.
 * The resulting signature is included in the /auth/onboard payload.
 */
export function signL2Registration(
	walletAddress: string,
	keyPair: StarkKeyPair,
): L2Signature {
	// pedersen(wallet, publicKey) — same as Python SDK
	const messageHash = pedersen(
		BigInt(walletAddress),
		BigInt(keyPair.publicKey),
	);

	// STARK sign — returns { r: bigint, s: bigint }
	const signature = starkSign(messageHash, keyPair.privateKey);

	return {
		r: `0x${signature.r.toString(16)}`,
		s: `0x${signature.s.toString(16)}`,
	};
}
