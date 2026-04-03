/**
 * Extended fee rates REST API.
 * Fetches maker/taker/builder fee rates per market.
 * Caches results per market (fees rarely change mid-session).
 */

import { EXTENDED_CONFIG } from '../config';
import { getStoredAccount } from '../utils/storage';

export interface ExtFeeData {
	makerFeeRate: string;
	takerFeeRate: string;
	builderFeeRate: string;
}

interface ExtFeeEntry {
	market: string;
	makerFeeRate: string;
	takerFeeRate: string;
	builderFeeRate: string;
}

interface ExtFeesResponse {
	status: string;
	data: ExtFeeEntry[];
}

const DEFAULT_FEES: ExtFeeData = {
	makerFeeRate: '0',
	takerFeeRate: '0.00025',
	builderFeeRate: '0.0001',
};

const feeCache = new Map<string, ExtFeeData>();

export function clearFeeCache(): void {
	feeCache.clear();
}

export async function fetchFees(
	walletAddress: string,
	market: string,
): Promise<ExtFeeData> {
	const cached = feeCache.get(market);
	if (cached) return cached;

	const account = getStoredAccount(walletAddress);
	if (!account?.apiKey) return DEFAULT_FEES;

	try {
		const response = await fetch(
			`${EXTENDED_CONFIG.REST_URL}/user/fees?market=${encodeURIComponent(market)}`,
			{
				headers: {
					'Content-Type': 'application/json',
					'X-Api-Key': account.apiKey,
				},
			},
		);

		if (!response.ok) return DEFAULT_FEES;

		const result = (await response.json()) as ExtFeesResponse;
		const entry = result.data?.find((item) => item.market === market);

		if (!entry) return DEFAULT_FEES;

		const feeData: ExtFeeData = {
			makerFeeRate: entry.makerFeeRate,
			takerFeeRate: entry.takerFeeRate,
			builderFeeRate: entry.builderFeeRate,
		};

		feeCache.set(market, feeData);
		return feeData;
	} catch {
		return DEFAULT_FEES;
	}
}
