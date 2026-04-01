/**
 * Order signing via the Extended Signer service.
 *
 * Delegates hash computation to a Python backend using fast_stark_crypto.
 */

import { SIGNER_URL, SIGNER_HEADERS } from '../services/signer-config';

export interface OrderSignatureParams {
	positionId: number;
	amountBuy: number;
	amountSell: number;
	assetIdBuy: string;
	assetIdSell: string;
	expiration: number;
	salt: number;
	starkPublicKey: string;
	starkPrivateKey: string;
	amountFee?: number;
	assetIdFee?: string;
}

const SIGNER_TIMEOUT = 60_000;

export async function signOrder(
	params: OrderSignatureParams,
): Promise<{ r: string; s: string }> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), SIGNER_TIMEOUT);

	try {
		const response = await fetch(`${SIGNER_URL}/sign-order`, {
			method: 'POST',
			headers: SIGNER_HEADERS,
			signal: controller.signal,
			body: JSON.stringify({
				position_id: params.positionId,
				amount_buy: params.amountBuy,
				amount_sell: params.amountSell,
				asset_id_buy: params.assetIdBuy,
				asset_id_sell: params.assetIdSell,
				expiration: params.expiration,
				salt: params.salt,
				public_key: params.starkPublicKey,
				private_key: params.starkPrivateKey,
				amount_fee: params.amountFee ?? 0,
				asset_id_fee: params.assetIdFee ?? '',
			}),
		});

		if (!response.ok) {
			const error = await response.text().catch(() => 'Signer error');
			throw new Error(`Order signing failed: ${error}`);
		}

		return response.json() as Promise<{ r: string; s: string }>;
	} finally {
		clearTimeout(timeout);
	}
}

export function calcOrderExpiration(): number {
	return Math.ceil(Date.now() / 1000) + 90 * 24 * 60 * 60;
}

export function generateOrderNonce(): number {
	return crypto.getRandomValues(new Uint32Array(1))[0];
}
