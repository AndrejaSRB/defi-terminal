import type {
	DexOnboarding,
	OnboardingParams,
	OnboardingStep,
	ExecuteStepParams,
} from '../onboarding';
import {
	createAgentWallet,
	buildApproveAgentTypedData,
	splitSignature,
} from '@/services/hyperliquid/agent';
import { approveAgent, fetchAgents } from '@/services/hyperliquid/exchange';

const AGENT_STORAGE_PREFIX = 'hl-agent';
const AGENT_NAME = 'AT Agent';

// ── Agent Storage ───────────────────────────────────────────────────
// Stores JSON: { privateKey, address, validUntil }

interface StoredAgent {
	privateKey: string;
	address: string;
	validUntil: number;
}

function getStoredAgent(walletAddress: string): StoredAgent | null {
	try {
		const key = `${AGENT_STORAGE_PREFIX}:${walletAddress.toLowerCase()}`;
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		return JSON.parse(raw) as StoredAgent;
	} catch {
		return null;
	}
}

function setStoredAgent(walletAddress: string, agent: StoredAgent): void {
	const key = `${AGENT_STORAGE_PREFIX}:${walletAddress.toLowerCase()}`;
	try {
		localStorage.setItem(key, JSON.stringify(agent));
	} catch {
		throw new Error(
			'Failed to store agent key. Clear browser data or disable private mode.',
		);
	}
}

function removeStoredAgent(walletAddress: string): void {
	const key = `${AGENT_STORAGE_PREFIX}:${walletAddress.toLowerCase()}`;
	localStorage.removeItem(key);
}

function isAgentValid(agent: StoredAgent): boolean {
	// Valid if expiration is in the future (with 5 min buffer)
	return agent.validUntil > Date.now() + 5 * 60 * 1000;
}

// ── Onboarding ──────────────────────────────────────────────────────

export const hyperliquidOnboarding: DexOnboarding = {
	getSteps({ totalRawUsd, walletAddress }: OnboardingParams): OnboardingStep[] {
		const hasDeposited = totalRawUsd > 0;
		const stored = getStoredAgent(walletAddress);
		const hasValidAgent = stored !== null && isAgentValid(stored);

		return [
			{
				id: 'deposit',
				label: 'Deposit',
				status: hasDeposited ? 'ready' : 'pending',
			},
			{
				id: 'agent',
				label: 'Enable Trading',
				status: hasValidAgent ? 'ready' : 'pending',
			},
		];
	},

	async executeStep({ stepId, walletAddress, sign }: ExecuteStepParams) {
		if (stepId === 'deposit') {
			return;
		}

		if (stepId === 'agent') {
			// 1. Generate agent wallet
			const agent = createAgentWallet();

			// 2. Build EIP-712 typed data
			const nonce = Date.now();
			const typedData = buildApproveAgentTypedData(
				agent.address,
				AGENT_NAME,
				nonce,
			);

			// 3. Sign with user's main wallet via Privy
			const rawSig = await sign(typedData);

			// 4. Split signature into r, s, v
			const { r, s, v } = splitSignature(rawSig as `0x${string}`);

			// 5. POST to HL exchange API
			await approveAgent({
				agentAddress: agent.address,
				agentName: AGENT_NAME,
				nonce,
				signature: { r, s, v },
			});

			// 6. Fetch agents to get validUntil from HL
			const agents = await fetchAgents(walletAddress);
			const registered = agents.find(
				(a) => a.address.toLowerCase() === agent.address.toLowerCase(),
			);
			// Default ~90 days if not found in list
			const validUntil =
				registered?.validUntil ?? Date.now() + 90 * 24 * 60 * 60 * 1000;

			// 7. Store agent with metadata
			setStoredAgent(walletAddress, {
				privateKey: agent.privateKey,
				address: agent.address,
				validUntil,
			});
		}
	},

	isReadyToTrade({ totalRawUsd, walletAddress }: OnboardingParams): boolean {
		const stored = getStoredAgent(walletAddress);
		return totalRawUsd > 0 && stored !== null && isAgentValid(stored);
	},
};

/**
 * Validate stored agent against HL's server.
 * If agent is expired or not found on HL, removes it from localStorage.
 * Returns the stored agent if valid, null otherwise.
 */
export async function validateAgent(
	walletAddress: string,
): Promise<StoredAgent | null> {
	const stored = getStoredAgent(walletAddress);
	if (!stored) return null;

	// Check local expiration first
	if (!isAgentValid(stored)) {
		removeStoredAgent(walletAddress);
		return null;
	}

	// Verify against HL server
	const agents = await fetchAgents(walletAddress);
	const serverAgent = agents.find(
		(a) => a.address.toLowerCase() === stored.address.toLowerCase(),
	);

	if (!serverAgent || serverAgent.validUntil <= Date.now()) {
		// Agent removed or expired on HL side
		removeStoredAgent(walletAddress);
		return null;
	}

	// Update validUntil from server (source of truth)
	if (serverAgent.validUntil !== stored.validUntil) {
		setStoredAgent(walletAddress, {
			...stored,
			validUntil: serverAgent.validUntil,
		});
	}

	return stored;
}

export { getStoredAgent, removeStoredAgent };
