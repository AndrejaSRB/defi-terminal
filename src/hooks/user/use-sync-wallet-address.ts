import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { walletAddressAtom } from '@/atoms/user/onboarding';
import { useAuth } from '../use-auth';

export function useSyncWalletAddress() {
	const { walletAddress } = useAuth();
	const setAddress = useSetAtom(walletAddressAtom);

	useEffect(() => {
		setAddress(walletAddress);
	}, [walletAddress, setAddress]);
}
