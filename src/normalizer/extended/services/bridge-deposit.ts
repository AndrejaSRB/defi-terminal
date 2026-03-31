/**
 * On-chain deposit operations — approve USDC + call depositWithId.
 *
 * Builds transaction data for the Rhino.fi bridge contract.
 * Pure functions, no React — returns encoded calldata for wallets to execute.
 */

import { encodeFunctionData, parseUnits } from 'viem';
import type { ChainMeta } from './bridge-types';

/** Minimal ABI for Rhino.fi bridge depositWithId */
const DEPOSIT_WITH_ID_ABI = [
	{
		name: 'depositWithId',
		type: 'function',
		stateMutability: 'nonpayable',
		inputs: [
			{ name: 'token', type: 'address' },
			{ name: 'amount', type: 'uint256' },
			{ name: 'commitmentId', type: 'uint256' },
		],
		outputs: [],
	},
] as const;

/**
 * Build depositWithId transaction data.
 * Calls the Rhino.fi bridge contract to deposit USDC with a commitment ID.
 */
export function buildDepositData(
	bridgeAddress: string,
	chainMeta: ChainMeta,
	amount: number,
	commitmentId: string,
): { to: string; data: string; chainId: number } {
	return {
		to: bridgeAddress,
		chainId: chainMeta.chainId,
		data: encodeFunctionData({
			abi: DEPOSIT_WITH_ID_ABI,
			functionName: 'depositWithId',
			args: [
				chainMeta.usdcAddress as `0x${string}`,
				parseUnits(String(amount), 6), // USDC = 6 decimals
				BigInt(`0x${commitmentId.replace(/^0x/, '')}`),
			],
		}),
	};
}
