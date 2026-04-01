/**
 * Extended open orders REST API.
 * Reads API key from localStorage.
 */

import { EXTENDED_CONFIG } from '../config';
import { getStoredAccount } from '../utils/storage';
import type { ExtOrder, ExtOrdersResponse } from '../types/order';

export async function fetchOpenOrders(
	walletAddress: string,
): Promise<ExtOrder[]> {
	const account = getStoredAccount(walletAddress);
	if (!account?.apiKey) return [];

	const response = await fetch(`${EXTENDED_CONFIG.REST_URL}/user/orders`, {
		headers: {
			'Content-Type': 'application/json',
			'X-Api-Key': account.apiKey,
		},
	});

	if (!response.ok) {
		console.error('[ExtOrders]', response.status, response.statusText);
		return [];
	}

	const result = (await response.json()) as ExtOrdersResponse;
	return result.data ?? [];
}
