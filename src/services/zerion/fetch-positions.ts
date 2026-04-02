const isDev = import.meta.env.DEV;
const ZERION_API_KEY = import.meta.env.VITE_ZERION_API_KEY ?? '';

// Dev: call Zerion directly (CORS works from localhost)
// Prod: proxy through Vercel serverless (CORS blocked from custom domains)
const ZERION_BASE = isDev ? 'https://api.zerion.io/v1' : '/api/zerion';

function getAuthHeader(): string {
	return `Basic ${btoa(`${ZERION_API_KEY}:`)}`;
}

export interface ZerionPosition {
	id: string;
	attributes: {
		position_type: string;
		quantity: {
			float: number;
		};
		value: number | null;
		price: number;
		fungible_info: {
			name: string;
			symbol: string;
			icon: { url: string } | null;
			flags: { verified: boolean };
			implementations: Array<{
				chain_id: string;
				address: string | null;
				decimals: number;
			}>;
		};
	};
	relationships: {
		chain: {
			data: {
				id: string;
			};
		};
	};
}

interface ZerionResponse {
	data: ZerionPosition[];
}

export async function fetchWalletPositions(
	address: string,
): Promise<ZerionPosition[]> {
	if (!ZERION_API_KEY || !address) return [];

	const params = new URLSearchParams({
		'filter[position_types]': 'wallet',
		'filter[trash]': 'only_non_trash',
		currency: 'usd',
		sort: 'value',
	});

	const url = `${ZERION_BASE}/wallets/${address}/positions/?${params}`;

	// In dev, send auth header directly. In prod, the proxy adds it server-side.
	const headers: Record<string, string> = {
		accept: 'application/json',
	};
	if (isDev) {
		headers.Authorization = getAuthHeader();
	}

	const response = await fetch(url, { headers });

	if (!response.ok) return [];

	const result = (await response.json()) as ZerionResponse;
	return result.data ?? [];
}
