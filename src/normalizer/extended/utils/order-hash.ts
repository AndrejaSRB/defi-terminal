/**
 * Order signing via the Extended Signer service.
 *
 * v2 endpoint: signer computes Stark amounts with Python Decimal precision.
 * Frontend sends human-readable values only — no Stark math on the client.
 */

import { SIGNER_URL, SIGNER_HEADERS } from '../services/signer-config';

export interface OrderSignParams {
	side: 'buy' | 'sell';
	qty: string;
	price: string;
	feeRate: string;
	syntheticId: string;
	collateralId: string;
	syntheticResolution: number;
	collateralResolution: number;
	positionId: number;
	expiration: number;
	salt: number;
	starkPublicKey: string;
	starkPrivateKey: string;
	/** For TP/SL: signer computes entire position size with Decimal precision */
	maxPositionValue?: string;
	quantityPrecision?: number;
}

export interface OrderSignResult {
	r: string;
	s: string;
	syntheticStark: string;
	collateralStark: string;
	feeStark: string;
}

const SIGNER_TIMEOUT = 60_000;

export async function signOrder(
	params: OrderSignParams,
): Promise<OrderSignResult> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), SIGNER_TIMEOUT);

	try {
		const response = await fetch(`${SIGNER_URL}/sign-order-v2`, {
			method: 'POST',
			headers: SIGNER_HEADERS,
			signal: controller.signal,
			body: JSON.stringify({
				side: params.side,
				qty: params.qty,
				price: params.price,
				fee_rate: params.feeRate,
				synthetic_id: params.syntheticId,
				collateral_id: params.collateralId,
				synthetic_resolution: params.syntheticResolution,
				collateral_resolution: params.collateralResolution,
				position_id: params.positionId,
				expiration: params.expiration,
				salt: params.salt,
				public_key: params.starkPublicKey,
				private_key: params.starkPrivateKey,
				...(params.maxPositionValue != null && {
					max_position_value: params.maxPositionValue,
					quantity_precision: params.quantityPrecision,
				}),
			}),
		});

		if (!response.ok) {
			const error = await response.text().catch(() => 'Signer error');
			throw new Error(`Order signing failed: ${error}`);
		}

		const data = (await response.json()) as {
			r: string;
			s: string;
			synthetic_stark: string;
			collateral_stark: string;
			fee_stark: string;
		};

		return {
			r: data.r,
			s: data.s,
			syntheticStark: data.synthetic_stark,
			collateralStark: data.collateral_stark,
			feeStark: data.fee_stark,
		};
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
