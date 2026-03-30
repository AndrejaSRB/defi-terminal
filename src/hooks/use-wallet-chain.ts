import { useState, useEffect, useCallback } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { useAuth } from './use-auth';

export function useWalletChain() {
	const { wallets } = useWallets();
	const { walletAddressRaw } = useAuth();
	const [currentChainId, setCurrentChainId] = useState<number | null>(null);

	// Find the connected wallet and track its chain
	const activeWallet = wallets.find(
		(wallet) =>
			wallet.address.toLowerCase() === walletAddressRaw?.toLowerCase(),
	);

	useEffect(() => {
		if (!activeWallet) {
			setCurrentChainId(null);
			return;
		}

		// Read initial chain
		const chainIdStr = activeWallet.chainId;
		if (chainIdStr) {
			// Privy returns chainId as "eip155:1" or just a number
			const parsed = chainIdStr.includes(':')
				? Number(chainIdStr.split(':')[1])
				: Number(chainIdStr);
			setCurrentChainId(parsed);
		}
	}, [activeWallet, activeWallet?.chainId]);

	const switchChain = useCallback(
		async (targetChainId: number) => {
			if (!activeWallet) throw new Error('No wallet connected');
			try {
				await activeWallet.switchChain(targetChainId);
				setCurrentChainId(targetChainId);
			} catch (switchError) {
				console.error('[WalletChain] Switch failed:', switchError);
				throw switchError;
			}
		},
		[activeWallet],
	);

	const isOnChain = useCallback(
		(chainId: number) => currentChainId === chainId,
		[currentChainId],
	);

	return {
		currentChainId,
		switchChain,
		isOnChain,
	};
}
