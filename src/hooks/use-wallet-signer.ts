import { useCallback } from 'react';
import { useSignTypedData } from '@privy-io/react-auth';
import type { SignTransactionFn } from '@/normalizer/onboarding';
import { useAuth } from './use-auth';

export function useWalletSigner() {
	const { signTypedData } = useSignTypedData();
	const { walletAddress, walletAddressRaw } = useAuth();

	const sign: SignTransactionFn = useCallback(
		async (typedData: unknown) => {
			const { signature } = await signTypedData(
				typedData as Parameters<typeof signTypedData>[0],
				{
					uiOptions: { showWalletUIs: false },
					address: walletAddressRaw as `0x${string}`,
				},
			);
			return signature as string;
		},
		[signTypedData, walletAddressRaw],
	);

	return { sign, walletAddress };
}
