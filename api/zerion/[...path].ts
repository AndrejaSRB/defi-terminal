import type { VercelRequest, VercelResponse } from '@vercel/node';

const ZERION_API = 'https://api.zerion.io/v1';
const ZERION_API_KEY = process.env.ZERION_API_KEY || '';

/**
 * Vercel serverless proxy for Zerion API.
 * Required because Zerion doesn't return CORS headers for custom domains.
 */
export default async function handler(
	req: VercelRequest,
	res: VercelResponse,
) {
	const origin = req.headers.origin ?? '';
	const allowedOrigin =
		origin === 'http://localhost:5173' || origin.endsWith('.vercel.app')
			? origin
			: '';

	res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.status(204).end();
		return;
	}

	const pathSegments = req.query.path;
	const apiPath = Array.isArray(pathSegments)
		? pathSegments.join('/')
		: pathSegments ?? '';

	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(req.query)) {
		if (key === 'path') continue;
		const values = Array.isArray(value) ? value : [value ?? ''];
		for (const val of values) params.append(key, val);
	}
	const search = params.toString() ? `?${params.toString()}` : '';
	const target = `${ZERION_API}/${apiPath}${search}`;

	try {
		const method = req.method ?? 'GET';
		const response = await fetch(target, {
			method,
			headers: {
				Authorization: `Basic ${Buffer.from(`${ZERION_API_KEY}:`).toString('base64')}`,
				accept: 'application/json',
			},
		});

		const contentType =
			response.headers.get('content-type') ?? 'application/json';
		res.setHeader('Content-Type', contentType);

		const data = Buffer.from(await response.arrayBuffer());
		res.status(response.status).send(data);
	} catch {
		res.status(502).json({ error: 'Zerion proxy failed' });
	}
}
