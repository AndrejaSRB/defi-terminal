/**
 * Extended order history REST API.
 * Reads API key from localStorage.
 */

import { EXTENDED_CONFIG } from '../config';
import { getStoredAccount } from '../utils/storage';
import type { ExtOrder } from '../types/order';

interface ExtOrderHistoryResponse {
	status: string;
	data: ExtOrder[];
	pagination?: { cursor: number; count: number };
}

export async function fetchOrderHistory(
	walletAddress: string,
	limit = 50,
): Promise<ExtOrder[]> {
	const account = getStoredAccount(walletAddress);
	if (!account?.apiKey) return [];

	const response = await fetch(
		`${EXTENDED_CONFIG.REST_URL}/user/orders/history?limit=${limit}`,
		{
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': account.apiKey,
			},
		},
	);

	if (!response.ok) {
		console.error('[ExtOrderHistory]', response.status, response.statusText);
		return [];
	}

	const result = (await response.json()) as ExtOrderHistoryResponse;
	return result.data ?? [];
}
