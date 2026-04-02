import { getStatus } from '@lifi/sdk';
import type { GetStatusRequest, StatusResponse } from '@lifi/sdk';

export async function fetchLifiStatus(
	txHash: string,
	fromChain?: number,
	toChain?: number,
): Promise<StatusResponse> {
	const params: GetStatusRequest = { txHash };
	if (fromChain) params.fromChain = fromChain;
	if (toChain) params.toChain = toChain;
	return getStatus(params);
}
