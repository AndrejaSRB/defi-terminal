/**
 * Extended funding history REST API.
 * Reads API key from localStorage.
 */

import { EXTENDED_CONFIG } from '../config';
import { getStoredAccount } from '../utils/storage';
import type {
	ExtFundingPayment,
	ExtFundingHistoryResponse,
} from '../types/funding';

/**
 * Fetch funding payment history.
 * `startTime` is required by Extended API.
 * Defaults to 30 days ago.
 */
export async function fetchFundingHistory(
	walletAddress: string,
	startTime?: number,
): Promise<ExtFundingPayment[]> {
	const account = getStoredAccount(walletAddress);
	if (!account?.apiKey) return [];

	const start = startTime ?? Date.now() - 30 * 24 * 60 * 60 * 1000;
	const endTime = Date.now();

	const response = await fetch(
		`${EXTENDED_CONFIG.REST_URL}/user/funding/history?startTime=${start}&endTime=${endTime}`,
		{
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': account.apiKey,
			},
		},
	);

	if (!response.ok) {
		console.error('[ExtFunding]', response.status, response.statusText);
		return [];
	}

	const result = (await response.json()) as ExtFundingHistoryResponse;
	return result.data ?? [];
}
