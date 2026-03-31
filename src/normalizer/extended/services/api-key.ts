/**
 * Extended API key creation: EIP-191 personal sign + API call.
 *
 * Step 3 of onboarding — user signs a personal message,
 * then we call POST /user/account/api-key with L1 auth headers.
 */

import type { SignMessageFn } from '@/normalizer/onboarding';
import { EXTENDED_CONFIG } from '../config';

const API_KEY_PATH = '/api/v1/user/account/api-key';

/**
 * Create an API key on Extended.
 *
 * Uses EIP-191 personal sign (not EIP-712) for authentication.
 * Message format: "{requestPath}@{timestamp}"
 *
 * @see https://github.com/x10xchange/python_sdk/blob/starknet/x10/perpetual/user_client/user_client.py
 */
export async function createApiKey(
	accountId: number,
	signMessage: SignMessageFn,
): Promise<string> {
	// Generate ISO 8601 timestamp (no milliseconds)
	const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

	// Build message: "{path}@{timestamp}"
	const message = `${API_KEY_PATH}@${timestamp}`;

	// Sign with EIP-191 personal sign
	const rawSignature = await signMessage(message);

	// Strip 0x prefix — Extended expects raw hex
	const signature = rawSignature.startsWith('0x')
		? rawSignature.slice(2)
		: rawSignature;

	// Call Extended API
	const response = await fetch(
		`${EXTENDED_CONFIG.ONBOARDING_URL}${API_KEY_PATH}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				L1_SIGNATURE: signature,
				L1_MESSAGE_TIME: timestamp,
				'X-X10-ACTIVE-ACCOUNT': String(accountId),
			},
			body: JSON.stringify({ description: 'Tegra Trading Key' }),
		},
	);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		const message =
			(errorData as { message?: string }).message ??
			`API key creation failed: ${response.status}`;
		throw new Error(message);
	}

	const result = (await response.json()) as {
		data: { key: string };
	};

	return result.data.key;
}
