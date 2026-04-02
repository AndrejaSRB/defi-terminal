export const LIFI_API_URL = 'https://li.quest/v1';
export const LIFI_API_KEY = import.meta.env.VITE_LIFI_API_KEY ?? '';
export const LIFI_APP_NAME = import.meta.env.VITE_LIFI_APP_NAME ?? '';

// ── Shared ──

export interface LifiToken {
	address: string;
	chainId: number;
	symbol: string;
	decimals: number;
	name: string;
	coinKey?: string;
	logoURI?: string;
	priceUSD?: string;
}

export interface LifiFeeCost {
	name: string;
	description?: string;
	percentage?: string;
	amount: string;
	amountUSD?: string;
	token: LifiToken;
}

export interface LifiGasCost {
	type: string;
	estimate: string;
	amount?: string;
	amountUSD?: string;
	price?: string;
	limit?: string;
	token: LifiToken;
}

export interface LifiTransactionRequest {
	from?: string;
	to: string;
	chainId?: number;
	data: string;
	value?: string;
	gasLimit?: string;
	gasPrice?: string;
}

export interface LifiToolDetails {
	key: string;
	name: string;
	logoURI: string;
}

export interface LifiAction {
	fromChainId: number;
	toChainId: number;
	fromToken: LifiToken;
	toToken: LifiToken;
	fromAmount: string;
	fromAddress: string;
	toAddress: string;
	slippage?: number;
}

// ── Quote ──

export interface LifiQuoteEstimate {
	fromAmount: string;
	toAmount: string;
	toAmountMin: string;
	approvalAddress: string;
	executionDuration: number;
	feeCosts: LifiFeeCost[];
	gasCosts: LifiGasCost[];
}

export interface LifiQuoteResponse {
	id: string;
	type: string;
	tool: string;
	toolDetails: LifiToolDetails;
	action: LifiAction;
	estimate: LifiQuoteEstimate;
	transactionRequest: LifiTransactionRequest;
}

// ── Advanced Routes ──

export interface LifiRoutesRequest {
	fromChainId: number;
	toChainId: number;
	fromTokenAddress: string;
	toTokenAddress: string;
	fromAmount: string;
	fromAddress: string;
	toAddress?: string;
	options?: LifiRoutesOptions;
}

export interface LifiRoutesOptions {
	slippage?: number;
	order?: 'CHEAPEST' | 'FASTEST';
	allowBridges?: string[];
	denyBridges?: string[];
	allowExchanges?: string[];
	denyExchanges?: string[];
}

export interface LifiRouteEstimate {
	fromAmount: string;
	toAmount: string;
	toAmountMin: string;
	tool?: string;
	approvalAddress: string;
	executionDuration: number;
	feeCosts: LifiFeeCost[];
	gasCosts: LifiGasCost[];
}

export interface LifiStep {
	id: string;
	type: string;
	tool: string;
	toolDetails: LifiToolDetails;
	action: LifiAction;
	estimate: LifiRouteEstimate;
	includedSteps?: LifiStep[];
	transactionRequest?: LifiTransactionRequest;
}

export interface LifiRoute {
	id: string;
	steps: LifiStep[];
	tags: string[];
}

export interface LifiRoutesResponse {
	routes: LifiRoute[];
}

// ── Status ──

export type LifiStatus =
	| 'NOT_FOUND'
	| 'INVALID'
	| 'PENDING'
	| 'DONE'
	| 'FAILED';

export type LifiSubstatus =
	| 'WAIT_SOURCE_CONFIRMATIONS'
	| 'WAIT_DESTINATION_TRANSACTION'
	| 'BRIDGE_NOT_AVAILABLE'
	| 'CHAIN_NOT_AVAILABLE'
	| 'COMPLETED'
	| 'PARTIAL'
	| 'REFUNDED'
	| 'NOT_PROCESSABLE_REFUND_NEEDED'
	| 'OUT_OF_GAS'
	| 'SLIPPAGE_EXCEEDED'
	| 'INSUFFICIENT_ALLOWANCE'
	| 'INSUFFICIENT_BALANCE'
	| 'EXPIRED'
	| 'UNKNOWN_ERROR';

export interface LifiStatusResponse {
	status: LifiStatus;
	substatus: LifiSubstatus;
	substatusMessage: string;
	tool: string;
	sending: {
		txHash: string;
		txLink: string;
		amount: string;
		token: LifiToken;
		chainId: number;
	};
	receiving?: {
		txHash: string;
		txLink: string;
		amount: string;
		token: LifiToken;
		chainId: number;
	};
	lifiExplorerLink?: string;
}

// ── Error ──

export interface LifiError {
	code: number;
	message: string;
}
