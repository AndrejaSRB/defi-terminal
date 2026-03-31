import { createPublicClient, http, erc20Abi, encodeFunctionData } from 'viem';
import { getChainConfig } from './config';

const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000';

export function isNativeToken(address: string | null): boolean {
	return !address || address === NATIVE_TOKEN;
}

export async function checkAllowance(
	chainId: number,
	tokenAddress: string,
	owner: string,
	spender: string,
): Promise<bigint> {
	const chainConfig = getChainConfig(chainId);
	if (!chainConfig) return 0n;

	const client = createPublicClient({
		chain: chainConfig.viemChain,
		transport: http(chainConfig.rpcUrl),
	});

	return client.readContract({
		address: tokenAddress as `0x${string}`,
		abi: erc20Abi,
		functionName: 'allowance',
		args: [owner as `0x${string}`, spender as `0x${string}`],
	});
}

export async function readTokenBalance(
	chainId: number,
	tokenAddress: string,
	owner: string,
): Promise<bigint> {
	const chainConfig = getChainConfig(chainId);
	if (!chainConfig) return 0n;

	const client = createPublicClient({
		chain: chainConfig.viemChain,
		transport: http(chainConfig.rpcUrl),
	});

	return client.readContract({
		address: tokenAddress as `0x${string}`,
		abi: erc20Abi,
		functionName: 'balanceOf',
		args: [owner as `0x${string}`],
	});
}

export function buildApproveCalldata(spender: string, amount: bigint): string {
	return encodeFunctionData({
		abi: erc20Abi,
		functionName: 'approve',
		args: [spender as `0x${string}`, amount],
	});
}
