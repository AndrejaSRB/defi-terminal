import { encodeFunctionData, erc20Abi } from 'viem';
import type { DepositConfig } from '@/normalizer/normalizer';

export interface DepositTx {
	to: string;
	data: string;
	chainId: number;
	value: string;
}

export function buildDepositTx(
	config: DepositConfig,
	amountWei: bigint,
): DepositTx {
	const data = encodeFunctionData({
		abi: erc20Abi,
		functionName: 'transfer',
		args: [config.bridgeAddress as `0x${string}`, amountWei],
	});

	return {
		to: config.tokenAddress,
		data,
		chainId: config.chainId,
		value: '0x0',
	};
}
