/**
 * Extended bridge API calls — fetch config, get quote, commit quote.
 *
 * All calls require API key authentication via X-Api-Key header.
 * Pure functions, no React.
 */

import { EXTENDED_CONFIG } from '../config';
import type { BridgeConfig, BridgeQuote } from './bridge-types';

function bridgeHeaders(apiKey: string): Record<string, string> {
	return {
		'Content-Type': 'application/json',
		'X-Api-Key': apiKey,
	};
}

/**
 * Fetch supported chains and bridge contract addresses.
 * GET /api/v1/user/bridge/config
 */
export async function fetchBridgeConfig(apiKey: string): Promise<BridgeConfig> {
	const response = await fetch(
		`${EXTENDED_CONFIG.REST_URL}/user/bridge/config`,
		{ headers: bridgeHeaders(apiKey) },
	);

	if (!response.ok) {
		throw new Error(`Bridge config failed: ${response.status}`);
	}

	// Extended API wraps responses in { status, data }
	const result = (await response.json()) as
		| BridgeConfig
		| { data: BridgeConfig };
	return 'data' in result ? result.data : result;
}

/**
 * Get a bridge quote for deposit.
 * GET /api/v1/user/bridge/quote?chainIn={chain}&chainOut=STRK&amount={amount}
 */
export async function getBridgeQuote(
	apiKey: string,
	chainIn: string,
	amount: number,
): Promise<BridgeQuote> {
	const params = new URLSearchParams({
		chainIn,
		chainOut: 'STRK',
		amount: String(amount),
	});

	const response = await fetch(
		`${EXTENDED_CONFIG.REST_URL}/user/bridge/quote?${params}`,
		{ headers: bridgeHeaders(apiKey) },
	);

	if (!response.ok) {
		throw new Error(`Bridge quote failed: ${response.status}`);
	}

	const result = (await response.json()) as BridgeQuote | { data: BridgeQuote };
	return 'data' in result ? result.data : result;
}

/**
 * Commit a bridge quote — tells Rhino.fi to start watching for the deposit.
 * POST /api/v1/user/bridge/quote?id={quoteId}
 * The quote ID itself is used as the commitment ID for depositWithId.
 */
export async function commitBridgeQuote(
	apiKey: string,
	quoteId: string,
): Promise<void> {
	const response = await fetch(
		`${EXTENDED_CONFIG.REST_URL}/user/bridge/quote?id=${quoteId}`,
		{
			method: 'POST',
			headers: bridgeHeaders(apiKey),
		},
	);

	if (!response.ok) {
		throw new Error(`Bridge commit failed: ${response.status}`);
	}
}
