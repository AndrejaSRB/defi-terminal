import { useCallback } from 'react';
import { useSendTransaction } from '@privy-io/react-auth';
import { useAuth } from './use-auth';

export interface SendTxParams {
	to: string;
	data?: string;
	value?: bigint;
	chainId?: number;
}

export function useWalletTransaction() {
	const { sendTransaction } = useSendTransaction();
	const { walletAddressRaw } = useAuth();

	const send = useCallback(
		async (params: SendTxParams): Promise<string> => {
			if (!walletAddressRaw) throw new Error('No wallet connected');

			const receipt = await sendTransaction(
				{
					to: params.to,
					data: params.data,
					value: params.value,
					chainId: params.chainId,
				} as Parameters<typeof sendTransaction>[0],
				{
					uiOptions: { showWalletUIs: true },
					address: walletAddressRaw as `0x${string}`,
				},
			);

			// biome-ignore lint: Privy returns different shapes across versions
			const hash = (receipt as any)?.hash ?? (receipt as any)?.transactionHash;
			if (!hash) throw new Error('No transaction hash returned');
			return hash as string;
		},
		[sendTransaction, walletAddressRaw],
	);

	return { send };
}
