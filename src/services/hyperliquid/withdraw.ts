import { splitSignature } from './agent';

const HL_EXCHANGE_URL = 'https://api.hyperliquid.xyz/exchange';

const WITHDRAW_TYPES = {
	'HyperliquidTransaction:Withdraw': [
		{ name: 'hyperliquidChain', type: 'string' },
		{ name: 'destination', type: 'string' },
		{ name: 'amount', type: 'string' },
		{ name: 'time', type: 'uint64' },
	],
} as const;

const WITHDRAW_DOMAIN = {
	name: 'HyperliquidSignTransaction',
	version: '1',
	chainId: 42161,
	verifyingContract:
		'0x0000000000000000000000000000000000000000' as `0x${string}`,
};

export interface WithdrawActionParams {
	amount: string;
	destination: string;
}

export function buildWithdrawAction(params: WithdrawActionParams) {
	return {
		type: 'withdraw3',
		hyperliquidChain: 'Mainnet',
		signatureChainId: '0xa4b1',
		amount: params.amount,
		time: Date.now(),
		destination: params.destination,
	};
}

export function buildWithdrawTypedData(
	action: ReturnType<typeof buildWithdrawAction>,
) {
	return {
		domain: WITHDRAW_DOMAIN,
		types: WITHDRAW_TYPES,
		primaryType: 'HyperliquidTransaction:Withdraw' as const,
		message: {
			hyperliquidChain: action.hyperliquidChain,
			destination: action.destination,
			amount: action.amount,
			time: BigInt(action.time),
		},
	};
}

export async function executeWithdraw(
	params: WithdrawActionParams,
	sign: (typedData: unknown) => Promise<string>,
): Promise<void> {
	const action = buildWithdrawAction(params);
	const typedData = buildWithdrawTypedData(action);

	const signature = await sign(typedData);
	const { r, s, v } = splitSignature(signature as `0x${string}`);

	const payload = {
		action,
		nonce: action.time,
		signature: { r, s, v },
	};

	const response = await fetch(HL_EXCHANGE_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Withdrawal failed: ${text}`);
	}

	const data = await response.json();
	if (data.status === 'err') {
		throw new Error(data.response || 'Withdrawal rejected');
	}
}
