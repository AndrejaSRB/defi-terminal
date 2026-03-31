/**
 * Extended account registration: EIP-712 signature + onboard API call.
 *
 * Step 2 of onboarding — user signs AccountRegistration message,
 * then we call POST /auth/onboard with all signatures.
 */

import type { SignTransactionFn } from '@/normalizer/onboarding';
import type { StarkKeyData } from './account-creation';
import { EXTENDED_CONFIG, ACCOUNT_REGISTRATION_TYPES } from '../config';

export interface ExtendedAccount {
	accountId: number;
	l2Vault: number;
	l2Key: string;
	bridgeStarknetAddress: string;
	description: string;
	status: string;
}

/**
 * Sign the EIP-712 AccountRegistration message.
 * Returns the l1_signature + timestamp for the onboard API.
 */
export async function signRegistration(
	walletAddress: string,
	sign: SignTransactionFn,
): Promise<{ signature: string; time: string }> {
	const time = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

	const typedData = {
		domain: EXTENDED_CONFIG.SIGNING_DOMAIN,
		types: ACCOUNT_REGISTRATION_TYPES,
		primaryType: 'AccountRegistration' as const,
		message: {
			accountIndex: 0,
			wallet: walletAddress as `0x${string}`,
			tosAccepted: true,
			time,
			action: 'REGISTER',
			host: EXTENDED_CONFIG.HOST,
		},
	};

	const signature = await sign(typedData);
	return { signature, time };
}

/**
 * Call Extended's POST /auth/onboard endpoint.
 * Combines l1Signature, l2Key, l2Signature, and accountCreation data.
 */
export async function callOnboardApi(
	walletAddress: string,
	l1Signature: string,
	loginTime: string,
	starkKeyData: StarkKeyData,
): Promise<ExtendedAccount> {
	// Strip 0x prefix from l1Signature (Extended expects raw hex)
	const l1Sig = l1Signature.startsWith('0x')
		? l1Signature.slice(2)
		: l1Signature;

	const payload = {
		l1Signature: l1Sig,
		l2Key: starkKeyData.keyPair.publicKey,
		l2Signature: {
			r: starkKeyData.l2Signature.r,
			s: starkKeyData.l2Signature.s,
		},
		accountCreation: {
			accountIndex: 0,
			wallet: walletAddress,
			tosAccepted: true,
			time: loginTime,
			action: 'REGISTER',
			host: EXTENDED_CONFIG.HOST,
		},
		referralCode: EXTENDED_CONFIG.REFERRAL_CODE,
	};

	const response = await fetch(
		`${EXTENDED_CONFIG.ONBOARDING_URL}/auth/onboard`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		},
	);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		const message =
			(errorData as { error?: { message?: string } }).error?.message ??
			`Onboard failed: ${response.status}`;
		throw new Error(message);
	}

	const result = (await response.json()) as {
		data: {
			defaultAccount: {
				id: number;
				l2Vault: number;
				l2Key: string;
				bridgeStarknetAddress: string;
				description: string;
				status: string;
			};
		};
	};

	const account = result.data.defaultAccount;
	return {
		accountId: account.id,
		l2Vault: account.l2Vault,
		l2Key: account.l2Key,
		bridgeStarknetAddress: account.bridgeStarknetAddress,
		description: account.description,
		status: account.status,
	};
}
