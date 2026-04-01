/**
 * Extended leverage REST API.
 * Reads API key from localStorage — no auth params needed.
 */

import { EXTENDED_CONFIG } from '../config';
import { getStoredAccount } from '../utils/storage';
import type { ExtLeverageResponse } from '../types/leverage';

export async function fetchLeverage(
	walletAddress: string,
	market: string,
): Promise<number> {
	const account = getStoredAccount(walletAddress);
	if (!account?.apiKey) return 20; // Default leverage

	const response = await fetch(
		`${EXTENDED_CONFIG.REST_URL}/user/leverage?market=${market}`,
		{
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': account.apiKey,
			},
		},
	);

	if (!response.ok) return 20;

	const result = (await response.json()) as ExtLeverageResponse;
	const entry = result.data?.find((item) => item.market === market);
	return entry ? parseInt(entry.leverage, 10) : 20;
}
