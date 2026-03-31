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

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': [...FORWARD_HEADERS, 'Content-Type'].join(
		', ',
	),
};

/**
 * Vercel serverless proxy for Extended API.
 * Required because Extended API does not return CORS headers.
 */
export default {
	async fetch(request: Request): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}

		const url = new URL(request.url);
		const apiPath = url.pathname.replace('/api/extended', '');
		const target = `${EXT_API}${apiPath}${url.search}`;

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			Origin: EXT_ORIGIN,
			'User-Agent': EXT_UA,
		};

		for (const key of FORWARD_HEADERS) {
			const value = request.headers.get(key);
			if (value) headers[key] = value;
		}

		try {
			const body =
				request.method !== 'GET' && request.method !== 'HEAD'
					? await request.text()
					: undefined;

			const response = await fetch(target, {
				method: request.method,
				headers,
				...(body ? { body } : {}),
			});

			const data = await response.arrayBuffer();
			const contentType =
				response.headers.get('content-type') ?? 'application/json';

			return new Response(data, {
				status: response.status,
				headers: {
					...CORS_HEADERS,
					'Content-Type': contentType,
				},
			});
		} catch {
			return new Response(
				JSON.stringify({ error: 'Proxy fetch failed' }),
				{
					status: 502,
					headers: {
						...CORS_HEADERS,
						'Content-Type': 'application/json',
					},
				},
			);
		}
	},
};
