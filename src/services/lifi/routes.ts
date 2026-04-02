import { getRoutes } from '@lifi/sdk';
import type { RoutesRequest, Route } from '@lifi/sdk';

const DEFAULT_SLIPPAGE = 0.005;
const MAX_ROUTES = 3;

export interface FetchRoutesParams {
	fromChainId: number;
	toChainId: number;
	fromTokenAddress: string;
	toTokenAddress: string;
	fromAmount: string;
	fromAddress: string;
	toAddress?: string;
}

export async function fetchLifiRoutes(
	params: FetchRoutesParams,
): Promise<Route[]> {
	const request: RoutesRequest = {
		fromChainId: params.fromChainId,
		toChainId: params.toChainId,
		fromTokenAddress: params.fromTokenAddress,
		toTokenAddress: params.toTokenAddress,
		fromAmount: params.fromAmount,
		fromAddress: params.fromAddress,
		toAddress: params.toAddress,
		options: {
			slippage: DEFAULT_SLIPPAGE,
			order: 'CHEAPEST',
		},
	};

	const result = await getRoutes(request);

	return result.routes.slice(0, MAX_ROUTES);
}

export type { Route } from '@lifi/sdk';
