import type { VercelRequest, VercelResponse } from '@vercel/node';

const SIGNER_URL =
	process.env.SIGNER_URL || 'https://extended-signer-1.onrender.com';
const SIGNING_SECRET = process.env.SIGNING_SECRET || '';

/**
 * Vercel serverless proxy for the Extended signer service.
 * Keeps SIGNER_URL and SIGNING_SECRET server-side only.
 */
export default async function handler(
	req: VercelRequest,
	res: VercelResponse,
) {
	// CORS headers
	const origin = req.headers.origin ?? '';
	const allowedOrigin =
		origin === 'http://localhost:5173' || origin.endsWith('.vercel.app')
			? origin
			: 'https://defi-terminal-seven.vercel.app';
	res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.status(204).end();
		return;
	}

	// Build target URL: /api/signer/sign-order-v2 → /sign-order-v2
	const pathSegments = req.query.path;
	const apiPath = Array.isArray(pathSegments)
		? pathSegments.join('/')
		: pathSegments ?? '';
	const target = `${SIGNER_URL}/${apiPath}`;

	// Forward with server-side secret
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};
	if (SIGNING_SECRET) {
		headers['X-Signing-Secret'] = SIGNING_SECRET;
	}

	try {
		const method = req.method ?? 'GET';
		const hasBody =
			method !== 'GET' && method !== 'HEAD' && req.body != null;

		const response = await fetch(target, {
			method,
			headers,
			...(hasBody ? { body: JSON.stringify(req.body) } : {}),
		});

		const contentType =
			response.headers.get('content-type') ?? 'application/json';
		res.setHeader('Content-Type', contentType);

		const data = Buffer.from(await response.arrayBuffer());
		res.status(response.status).send(data);
	} catch {
		res.status(502).json({ error: 'Signer proxy failed' });
	}
}
