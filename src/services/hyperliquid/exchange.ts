const HL_EXCHANGE_URL = 'https://api.hyperliquid.xyz/exchange';
const HL_INFO_URL = 'https://api.hyperliquid.xyz/info';

// ── Agent Approval ──────────────────────────────────────────────────

interface ApproveAgentParams {
	agentAddress: string;
	agentName: string;
	nonce: number;
	signature: { r: string; s: string; v: number };
}

export async function approveAgent(params: ApproveAgentParams): Promise<void> {
	const res = await fetch(HL_EXCHANGE_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			action: {
				type: 'approveAgent',
				hyperliquidChain: 'Mainnet',
				agentAddress: params.agentAddress,
				agentName: params.agentName,
				nonce: params.nonce,
				signatureChainId: '0xa4b1',
			},
			nonce: params.nonce,
			signature: params.signature,
			vaultAddress: null,
			isFrontend: true,
			expiresAfter: null,
		}),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Agent approval failed: ${text}`);
	}

	const data = await res.json();
	if (data.status === 'err') {
		throw new Error(data.response || 'Agent approval rejected');
	}
}

// ── Agent Validation ────────────────────────────────────────────────

export interface HlAgent {
	name: string;
	address: string;
	validUntil: number;
}

export async function fetchAgents(walletAddress: string): Promise<HlAgent[]> {
	try {
		const res = await fetch(HL_INFO_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				type: 'extraAgents',
				user: walletAddress,
			}),
		});
		if (!res.ok) return [];
		return (await res.json()) as HlAgent[];
	} catch {
		return [];
	}
}
