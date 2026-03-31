/**
 * localStorage wrapper for Extended account credentials.
 *
 * Stores Stark keys, API key, and account metadata per wallet address.
 * Everything is recoverable via re-onboarding (3 signatures).
 */

const STORAGE_PREFIX = 'extended-account';

export interface StoredExtendedAccount {
	accountId: number;
	l2Vault: number;
	starkPublicKey: string;
	starkPrivateKey: string;
	apiKey: string;
	bridgeStarknetAddress: string;
	createdAt: number;
}

function storageKey(walletAddress: string): string {
	return `${STORAGE_PREFIX}:${walletAddress.toLowerCase()}`;
}

export function getStoredAccount(
	walletAddress: string,
): StoredExtendedAccount | null {
	try {
		const raw = localStorage.getItem(storageKey(walletAddress));
		if (!raw) return null;
		return JSON.parse(raw) as StoredExtendedAccount;
	} catch {
		return null;
	}
}

export function storeAccount(
	walletAddress: string,
	account: StoredExtendedAccount,
): void {
	localStorage.setItem(storageKey(walletAddress), JSON.stringify(account));
}

export function clearAccount(walletAddress: string): void {
	localStorage.removeItem(storageKey(walletAddress));
}

/** Check if stored account has all required fields for trading */
export function isAccountValid(account: StoredExtendedAccount | null): boolean {
	if (!account) return false;
	return !!(
		account.starkPrivateKey &&
		account.starkPublicKey &&
		account.apiKey &&
		account.accountId
	);
}
