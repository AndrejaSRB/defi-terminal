/**
 * Extended user trades REST API.
 * Reads API key from localStorage.
 */

import { EXTENDED_CONFIG } from '../config';
import { getStoredAccount } from '../utils/storage';
import type {
	ExtTradeHistory,
	ExtTradeHistoryResponse,
} from '../types/trade-history';

export async function fetchUserTrades(
	walletAddress: string,
	limit = 50,
): Promise<ExtTradeHistory[]> {
	const account = getStoredAccount(walletAddress);
	if (!account?.apiKey) return [];

	const response = await fetch(
		`${EXTENDED_CONFIG.REST_URL}/user/trades?limit=${limit}`,
		{
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': account.apiKey,
			},
		},
	);

	if (!response.ok) {
		console.error('[ExtTrades]', response.status, response.statusText);
		return [];
	}

	const result = (await response.json()) as ExtTradeHistoryResponse;
	return result.data ?? [];
}
