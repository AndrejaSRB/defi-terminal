/**
 * Extended DEX onboarding — DexOnboarding implementation.
 *
 * Thin orchestrator that delegates to focused services:
 * - account-creation: EIP-712 sign + Stark key derivation
 * - account-registration: EIP-712 sign + POST /auth/onboard
 * - api-key: EIP-191 sign + POST /user/account/api-key
 *
 * Handles partial state: if step 3 (API key) fails after account creation,
 * a retry only re-signs step 3 instead of all 3 steps.
 *
 * All credentials stored in localStorage. Fully recoverable via re-onboarding.
 */

import type { DexOnboarding } from '@/normalizer/onboarding';
import {
	signAccountCreation,
	deriveAndSignL2Keys,
} from './services/account-creation';
import {
	signRegistration,
	callOnboardApi,
} from './services/account-registration';
import { createApiKey } from './services/api-key';
import {
	getStoredAccount,
	storeAccount,
	isAccountValid,
} from './utils/storage';

export const extendedOnboarding: DexOnboarding = {
	getSteps({ walletAddress }) {
		const account = getStoredAccount(walletAddress);
		const ready = isAccountValid(account);

		return [
			{
				id: 'enable-trading',
				label: 'Enable Trading',
				status: ready ? 'ready' : 'pending',
			},
		];
	},

	async executeStep({ walletAddress, sign, signMessage }) {
		if (!signMessage) {
			throw new Error('Extended onboarding requires personal sign capability');
		}

		// Check for partial state — account created but API key missing
		const existing = getStoredAccount(walletAddress);
		if (existing && existing.accountId && !existing.apiKey) {
			// Retry only step 3: API key creation
			const apiKey = await createApiKey(existing.accountId, signMessage);
			storeAccount(walletAddress, { ...existing, apiKey });
			return;
		}

		// Step 1: Sign AccountCreation → derive Stark keys
		const accountCreationSig = await signAccountCreation(walletAddress, sign);
		const starkKeyData = deriveAndSignL2Keys(walletAddress, accountCreationSig);

		// Step 2: Sign AccountRegistration → call onboard API
		const { signature: l1Signature, time: loginTime } = await signRegistration(
			walletAddress,
			sign,
		);

		const account = await callOnboardApi(
			walletAddress,
			l1Signature,
			loginTime,
			starkKeyData,
		);

		// Store partial state immediately — so step 3 failure can retry from here
		storeAccount(walletAddress, {
			accountId: account.accountId,
			l2Vault: account.l2Vault,
			starkPublicKey: starkKeyData.keyPair.publicKey,
			starkPrivateKey: starkKeyData.keyPair.privateKey,
			apiKey: '',
			bridgeStarknetAddress: account.bridgeStarknetAddress,
			createdAt: Date.now(),
		});

		// Step 3: Create API key (EIP-191 personal sign)
		const apiKey = await createApiKey(account.accountId, signMessage);

		// Update with API key
		storeAccount(walletAddress, {
			accountId: account.accountId,
			l2Vault: account.l2Vault,
			starkPublicKey: starkKeyData.keyPair.publicKey,
			starkPrivateKey: starkKeyData.keyPair.privateKey,
			apiKey,
			bridgeStarknetAddress: account.bridgeStarknetAddress,
			createdAt: Date.now(),
		});
	},

	isReadyToTrade({ walletAddress }) {
		return isAccountValid(getStoredAccount(walletAddress));
	},
};
