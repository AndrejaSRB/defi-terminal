/**
 * Extended balance REST API.
 * Reads API key from localStorage — no auth params needed.
 */

import { EXTENDED_CONFIG } from '../config';
import { getStoredAccount } from '../utils/storage';
import type { ExtBalance, ExtBalanceResponse } from '../types/balance';

export async function fetchBalance(
	walletAddress: string,
): Promise<ExtBalance | null> {
	const account = getStoredAccount(walletAddress);
	if (!account?.apiKey) return null;

	const response = await fetch(`${EXTENDED_CONFIG.REST_URL}/user/balance`, {
		headers: {
			'Content-Type': 'application/json',
			'X-Api-Key': account.apiKey,
		},
	});

	// 404 = no balance yet (not deposited), not an error
	if (response.status === 404) return null;
	if (!response.ok) {
		console.error('[ExtBalance]', response.status, response.statusText);
		return null;
	}

	const result = (await response.json()) as ExtBalanceResponse;
	return result.data;
}
