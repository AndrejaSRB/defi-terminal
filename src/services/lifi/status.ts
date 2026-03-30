import { LIFI_API_URL, LIFI_API_KEY, type LifiStatusResponse } from './types';

export async function fetchLifiStatus(
	txHash: string,
	fromChain?: number,
	toChain?: number,
	bridge?: string,
): Promise<LifiStatusResponse> {
	const params = new URLSearchParams({ txHash });
	if (fromChain) params.set('fromChain', fromChain.toString());
	if (toChain) params.set('toChain', toChain.toString());
	if (bridge) params.set('bridge', bridge);

	const response = await fetch(`${LIFI_API_URL}/status?${params}`, {
		headers: LIFI_API_KEY ? { 'x-lifi-api-key': LIFI_API_KEY } : {},
	});

	if (!response.ok) {
		throw new Error(`LI.FI status check failed: ${response.status}`);
	}

	return (await response.json()) as LifiStatusResponse;
}
