import { useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { ellipsisAddress } from '@/lib/address';

export function useAuth() {
	const { ready, authenticated, login, logout, user } = usePrivy();

	return useMemo(() => {
		const rawAddress = user?.wallet?.address ?? null;
		const walletAddress =
			ready && authenticated ? (rawAddress?.toLowerCase() ?? null) : null;

		return {
			isReady: ready,
			isAuthenticated: authenticated,
			walletAddress,
			// Original checksum address for Privy signing
			walletAddressRaw: ready && authenticated ? rawAddress : null,
			walletClientType: user?.wallet?.walletClientType ?? null,
			shortAddress: ellipsisAddress(walletAddress) ?? null,
			login,
			logout,
		};
	}, [ready, authenticated, user, login, logout]);
}
