import { useCallback } from 'react';
import {
	useSignTypedData,
	useSignMessage as usePrivySignMessage,
} from '@privy-io/react-auth';
import type { SignTransactionFn, SignMessageFn } from '@/normalizer/onboarding';
import { useAuth } from './use-auth';

export function useWalletSigner() {
	const { signTypedData } = useSignTypedData();
	const { signMessage: privySignMessage } = usePrivySignMessage();
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

	const signMessage: SignMessageFn = useCallback(
		async (message: string) => {
			const { signature } = await privySignMessage(
				{ message },
				{
					uiOptions: { showWalletUIs: false },
					address: walletAddressRaw as `0x${string}`,
				},
			);
			return signature as string;
		},
		[privySignMessage, walletAddressRaw],
	);

	return { sign, signMessage, walletAddress };
}
