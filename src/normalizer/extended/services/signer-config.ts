/**
 * Shared config for the Extended signer service.
 *
 * In production: proxied through Vercel serverless (/api/signer/).
 * In dev: proxied through Vite middleware (/api/signer/).
 * The signing secret is server-side only — never in the JS bundle.
 */

export const SIGNER_URL = '/api/signer';

export const SIGNER_HEADERS: Record<string, string> = {
	'Content-Type': 'application/json',
};
