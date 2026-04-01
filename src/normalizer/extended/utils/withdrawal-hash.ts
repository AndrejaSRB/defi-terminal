/**
 * Withdrawal signing via the Extended Signer service.
 *
 * Delegates hash computation to a Python backend using fast_stark_crypto.
 */

import { SIGNER_URL, SIGNER_HEADERS } from '../services/signer-config';

export interface WithdrawalSignatureParams {
	recipient: string;
	positionId: number | string;
	collateralId: string;
	amount: string;
	expiration: number;
	salt: number;
	starkPublicKey: string;
	starkPrivateKey: string;
}

const SIGNER_TIMEOUT = 60_000;

export async function signWithdrawal(
	params: WithdrawalSignatureParams,
): Promise<{ r: string; s: string }> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), SIGNER_TIMEOUT);

	try {
		const response = await fetch(`${SIGNER_URL}/sign-withdrawal`, {
			method: 'POST',
			headers: SIGNER_HEADERS,
			signal: controller.signal,
			body: JSON.stringify({
				recipient: params.recipient,
				position_id: Number(params.positionId),
				amount: Number(params.amount),
				expiration: params.expiration,
				salt: params.salt,
				public_key: params.starkPublicKey,
				private_key: params.starkPrivateKey,
			}),
		});

		if (!response.ok) {
			const error = await response.text().catch(() => 'Signer error');
			throw new Error(`Withdrawal signing failed: ${error}`);
		}

		return response.json() as Promise<{ r: string; s: string }>;
	} finally {
		clearTimeout(timeout);
	}
}

export function calcWithdrawalExpiration(): number {
	return Math.ceil(Date.now() / 1000) + 15 * 24 * 60 * 60;
}

export function generateWithdrawalNonce(): number {
	return crypto.getRandomValues(new Uint32Array(1))[0];
}
