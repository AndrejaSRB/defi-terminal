/**
 * Shared config for the Extended signer service.
 * Single source of truth for URL and auth secret.
 */

export const SIGNER_URL =
	import.meta.env.VITE_SIGNER_URL || 'https://extended-signer-1.onrender.com';

export const SIGNING_SECRET = import.meta.env.VITE_SIGNING_SECRET || '';

export const SIGNER_HEADERS: Record<string, string> = {
	'Content-Type': 'application/json',
	...(SIGNING_SECRET ? { 'X-Signing-Secret': SIGNING_SECRET } : {}),
};
