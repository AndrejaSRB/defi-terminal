import { useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { ellipsisAddress } from '@/lib/address';

export function useAuth() {
	const { ready, authenticated, login, logout, user } = usePrivy();

	return useMemo(() => {
		const walletAddress =
			ready && authenticated
				? (user?.wallet?.address?.toLowerCase() ?? null)
				: null;

		return {
			isReady: ready,
			isAuthenticated: authenticated,
			walletAddress,
			shortAddress: ellipsisAddress(walletAddress) ?? null,
			login,
			logout,
		};
	}, [ready, authenticated, user, login, logout]);
}
