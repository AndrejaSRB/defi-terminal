import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

export function createAgentWallet() {
	const privateKey = generatePrivateKey();
	const account = privateKeyToAccount(privateKey);
	return { address: account.address, privateKey };
}

export function buildApproveAgentTypedData(
	agentAddress: string,
	agentName: string,
	nonce: number,
) {
	return {
		domain: {
			name: 'HyperliquidSignTransaction',
			version: '1',
			chainId: 42161,
			verifyingContract:
				'0x0000000000000000000000000000000000000000' as `0x${string}`,
		},
		primaryType: 'HyperliquidTransaction:ApproveAgent' as const,
		types: {
			'HyperliquidTransaction:ApproveAgent': [
				{ name: 'hyperliquidChain', type: 'string' },
				{ name: 'agentAddress', type: 'address' },
				{ name: 'agentName', type: 'string' },
				{ name: 'nonce', type: 'uint64' },
			],
		},
		message: {
			hyperliquidChain: 'Mainnet',
			agentAddress: agentAddress as `0x${string}`,
			agentName: agentName || '',
			nonce: BigInt(nonce),
		},
	};
}

export function splitSignature(signature: `0x${string}`) {
	if (signature.length !== 132) {
		throw new Error('Invalid signature length');
	}
	const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
	const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
	const v = Number.parseInt(signature.slice(130, 132), 16);
	return { r, s, v };
}
