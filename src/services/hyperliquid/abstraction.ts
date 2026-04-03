/**
 * HIP-3 User Abstraction — unified account mode.
 *
 * Enables users to trade all market types (crypto, stocks, commodities)
 * with a single unified balance.
 */

const HL_INFO_URL = 'https://api.hyperliquid.xyz/info';
const HL_EXCHANGE_URL = 'https://api.hyperliquid.xyz/exchange';

export type AbstractionMode = 'disabled' | 'unifiedAccount' | 'portfolioMargin';

export async function fetchUserAbstraction(
	userAddress: string,
): Promise<AbstractionMode> {
	try {
		const response = await fetch(HL_INFO_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				type: 'userAbstraction',
				user: userAddress,
			}),
		});
		if (!response.ok) return 'disabled';
		return (await response.json()) as AbstractionMode;
	} catch {
		return 'disabled';
	}
}

export function buildSetAbstractionTypedData(
	userAddress: string,
	mode: AbstractionMode,
	nonce: number,
) {
	return {
		domain: {
			name: 'HyperliquidSignTransaction',
			version: '1',
			chainId: 42161,
			verifyingContract:
				'0x0000000000000000000000000000000000000000' as `0x${string}`,
		},
		primaryType: 'HyperliquidTransaction:SetAbstraction' as const,
		types: {
			'HyperliquidTransaction:SetAbstraction': [
				{ name: 'hyperliquidChain', type: 'string' },
				{ name: 'user', type: 'address' },
				{ name: 'abstraction', type: 'string' },
				{ name: 'nonce', type: 'uint64' },
			],
		},
		message: {
			hyperliquidChain: 'Mainnet',
			user: userAddress as `0x${string}`,
			abstraction: mode,
			nonce: BigInt(nonce),
		},
	};
}

export async function setUserAbstraction(params: {
	userAddress: string;
	mode: AbstractionMode;
	nonce: number;
	signature: { r: string; s: string; v: number };
}): Promise<void> {
	const response = await fetch(HL_EXCHANGE_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			action: {
				type: 'userSetAbstraction',
				hyperliquidChain: 'Mainnet',
				signatureChainId: '0xa4b1',
				user: params.userAddress,
				abstraction: params.mode,
				nonce: params.nonce,
			},
			nonce: params.nonce,
			signature: params.signature,
			vaultAddress: null,
		}),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Set abstraction failed: ${text}`);
	}

	const data = await response.json();
	if (data.status === 'err') {
		throw new Error(data.response || 'Set abstraction rejected');
	}
}
