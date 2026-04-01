/**
 * Extended withdrawal REST API.
 * Gets signature from the signer service, then submits to Extended.
 */

import { EXTENDED_CONFIG } from '../config';
import { getStoredAccount } from '../utils/storage';
import {
	signWithdrawal,
	calcWithdrawalExpiration,
	generateWithdrawalNonce,
} from '../utils/withdrawal-hash';

const COLLATERAL_ID = '0x1';

export interface WithdrawalParams {
	walletAddress: string;
	amount: number;
	chainId: string;
	quoteId: string;
}

export async function submitWithdrawal(
	params: WithdrawalParams,
): Promise<number> {
	const account = getStoredAccount(params.walletAddress);
	if (!account?.apiKey || !account.starkPrivateKey) {
		throw new Error('Not onboarded — please enable trading first');
	}

	const salt = generateWithdrawalNonce();
	const expiration = calcWithdrawalExpiration();
	const quantumAmount = Math.floor(params.amount * 1e6).toString();
	const recipient = toCanonicalAddress(account.bridgeStarknetAddress);

	// Sign via the Python signer service (async)
	const signature = await signWithdrawal({
		recipient,
		positionId: account.l2Vault,
		collateralId: COLLATERAL_ID,
		amount: quantumAmount,
		expiration,
		salt,
		starkPublicKey: account.starkPublicKey,
		starkPrivateKey: account.starkPrivateKey,
	});

	const payload = {
		accountId: String(account.accountId),
		amount: String(params.amount),
		chainId: params.chainId,
		asset: 'USD',
		quoteId: params.quoteId,
		settlement: {
			recipient,
			positionId: Number(account.l2Vault),
			collateralId: COLLATERAL_ID,
			amount: quantumAmount,
			expiration: { seconds: expiration },
			salt,
			signature: {
				r: signature.r,
				s: signature.s,
			},
		},
	};

	const response = await fetch(`${EXTENDED_CONFIG.REST_URL}/user/withdrawal`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Api-Key': account.apiKey,
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		const message =
			(errorData as { error?: { message?: string } }).error?.message ??
			`Withdrawal failed: ${response.status}`;
		throw new Error(message);
	}

	const result = (await response.json()) as { status: string; data: number };
	return result.data;
}

/** Strip leading zeros after 0x — matches Extended's canonical address format */
function toCanonicalAddress(address: string): string {
	const hex = address.startsWith('0x') ? address.slice(2) : address;
	const stripped = hex.replace(/^0+/, '') || '0';
	return `0x${stripped}`;
}
