import {
	LIFI_API_URL,
	LIFI_API_KEY,
	type LifiQuoteResponse,
	type LifiError,
} from './types';

export interface QuoteParams {
	fromChain: number;
	toChain: number;
	fromToken: string;
	toToken: string;
	fromAmount: string;
	fromAddress: string;
	toAddress?: string;
	slippage?: number;
}

export async function fetchLifiQuote(
	params: QuoteParams,
): Promise<LifiQuoteResponse> {
	const searchParams = new URLSearchParams({
		fromChain: params.fromChain.toString(),
		toChain: params.toChain.toString(),
		fromToken: params.fromToken,
		toToken: params.toToken,
		fromAmount: params.fromAmount,
		fromAddress: params.fromAddress,
		slippage: (params.slippage ?? 0.005).toString(),
	});

	if (params.toAddress) {
		searchParams.set('toAddress', params.toAddress);
	}

	const response = await fetch(`${LIFI_API_URL}/quote?${searchParams}`, {
		headers: LIFI_API_KEY ? { 'x-lifi-api-key': LIFI_API_KEY } : {},
	});

	if (!response.ok) {
		const error = (await response.json().catch(() => null)) as LifiError | null;
		throw new Error(error?.message ?? `LI.FI quote failed: ${response.status}`);
	}

	return (await response.json()) as LifiQuoteResponse;
}
