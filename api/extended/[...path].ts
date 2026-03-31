import type { VercelRequest, VercelResponse } from '@vercel/node';

const EXT_API = 'https://api.starknet.extended.exchange';
const EXT_UA = 'Mozilla/5.0 Tegra/1.0';
const EXT_ORIGIN = 'https://app.extended.exchange';

const FORWARD_HEADERS = [
	'x-api-key',
	'l1_signature',
	'l1_message_time',
	'l1-signature',
	'l1-message-time',
	'x-x10-active-account',
];

/**
 * Vercel serverless proxy for Extended API.
 * Required because Extended API does not return CORS headers.
 * Mirrors the Vite dev proxy behavior for production.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
	const { path } = req.query;
	const apiPath = Array.isArray(path) ? path.join('/') : path ?? '';
	const search = req.url?.includes('?')
		? `?${req.url.split('?').slice(1).join('?')}`
		: '';

	// Strip the [...path] query param from search string
	const cleanSearch = search
		.replace(/[?&]path=[^&]*/g, '')
		.replace(/^\?&/, '?')
		.replace(/^\?$/, '');

	const target = `${EXT_API}/${apiPath}${cleanSearch}`;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'Origin': EXT_ORIGIN,
		'User-Agent': EXT_UA,
	};

	for (const key of FORWARD_HEADERS) {
		const value = req.headers[key];
		if (typeof value === 'string') headers[key] = value;
	}

	try {
		const response = await fetch(target, {
			method: req.method ?? 'GET',
			headers,
			...(req.body ? { body: JSON.stringify(req.body) } : {}),
		});

		const data = await response.arrayBuffer();

		// Set CORS headers
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', FORWARD_HEADERS.join(', ') + ', Content-Type');

		// Handle preflight
		if (req.method === 'OPTIONS') {
			res.status(204).end();
			return;
		}

		// Forward content type
		const contentType = response.headers.get('content-type');
		if (contentType) res.setHeader('Content-Type', contentType);

		res.status(response.status).send(Buffer.from(data));
	} catch {
		res.status(502).json({ error: 'Proxy fetch failed' });
	}
}
