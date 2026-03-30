export const LIFI_API_URL = 'https://li.quest/v1';
export const LIFI_API_KEY = import.meta.env.VITE_LIFI_API_KEY ?? '';

// ── Quote ──

export interface LifiToken {
	address: string;
	chainId: number;
	symbol: string;
	decimals: number;
	name: string;
	logoURI: string;
	priceUSD: string;
}

export interface LifiFeeCost {
	name: string;
	amount: string;
	amountUSD: string;
	token: LifiToken;
}

export interface LifiGasCost {
	type: string;
	estimate: string;
	amountUSD: string;
	token: LifiToken;
}

export interface LifiEstimate {
	fromAmount: string;
	toAmount: string;
	toAmountMin: string;
	approvalAddress: string;
	executionDuration: number;
	feeCosts: LifiFeeCost[];
	gasCosts: LifiGasCost[];
}

export interface LifiTransactionRequest {
	from: string;
	to: string;
	chainId: number;
	data: string;
	value: string;
	gasLimit: string;
	gasPrice: string;
}

export interface LifiQuoteResponse {
	id: string;
	type: string;
	tool: string;
	toolDetails: { key: string; name: string; logoURI: string };
	action: {
		fromChainId: number;
		toChainId: number;
		fromToken: LifiToken;
		toToken: LifiToken;
		fromAmount: string;
		slippage: number;
		fromAddress: string;
		toAddress: string;
	};
	estimate: LifiEstimate;
	transactionRequest: LifiTransactionRequest;
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
