/**
 * Extended positions REST API.
 * Reads API key from localStorage — no auth params needed.
 */

import { EXTENDED_CONFIG } from '../config';
import { getStoredAccount } from '../utils/storage';
import type { ExtPosition, ExtPositionsResponse } from '../types/position';

export async function fetchPositions(
	walletAddress: string,
): Promise<ExtPosition[]> {
	const account = getStoredAccount(walletAddress);
	if (!account?.apiKey) return [];

	const response = await fetch(`${EXTENDED_CONFIG.REST_URL}/user/positions`, {
		headers: {
			'Content-Type': 'application/json',
			'X-Api-Key': account.apiKey,
		},
	});

	if (!response.ok) {
		console.error('[ExtPositions]', response.status, response.statusText);
		return [];
	}

	const result = (await response.json()) as ExtPositionsResponse;
	return result.data ?? [];
}
