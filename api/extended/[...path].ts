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
 */
export default async function handler(
	req: VercelRequest,
	res: VercelResponse,
) {
	// CORS headers — restrict to own domains
	const origin = req.headers.origin ?? '';
	const allowedOrigin =
		origin === 'http://localhost:5173' ||
		origin.endsWith('.vercel.app')
			? origin
			: 'https://defi-terminal-seven.vercel.app';
	res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, PATCH, PUT, DELETE, OPTIONS',
	);
	res.setHeader(
		'Access-Control-Allow-Headers',
		[...FORWARD_HEADERS, 'Content-Type'].join(', '),
	);

	if (req.method === 'OPTIONS') {
		res.status(204).end();
		return;
	}

	// Build target URL: /api/extended/api/v1/info/markets → /api/v1/info/markets
	const pathSegments = req.query.path;
	const apiPath = Array.isArray(pathSegments)
		? pathSegments.join('/')
		: pathSegments ?? '';

	// Rebuild query string without the internal 'path' param
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(req.query)) {
		if (key === 'path') continue;
		const values = Array.isArray(value) ? value : [value ?? ''];
		for (const val of values) params.append(key, val);
	}
	const search = params.toString() ? `?${params.toString()}` : '';
	const target = `${EXT_API}/${apiPath}${search}`;

	// Forward relevant headers
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		Origin: EXT_ORIGIN,
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

		const contentType =
			response.headers.get('content-type') ?? 'application/json';
		res.setHeader('Content-Type', contentType);

		const data = Buffer.from(await response.arrayBuffer());
		res.status(response.status).send(data);
	} catch (err) {
		res.status(502).json({ error: 'Proxy fetch failed', details: String(err) });
	}
}
