import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { activeTokenAtom } from '@/atoms/active-token';
import { userTradingContextAtom } from '@/atoms/user/trading-context';
import { useAuth } from '../use-auth';

export function useDexUserTradingContext() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const { walletAddress } = useAuth();
	const token = useAtomValue(activeTokenAtom);
	const setContext = useSetAtom(userTradingContextAtom);

	useEffect(() => {
		if (!walletAddress) {
			setContext(null);
			return;
		}

		if (
			!normalizer.channels.userTradingContext ||
			!normalizer.parseUserTradingContext
		)
			return;

		const channel = normalizer.channels.userTradingContext(
			walletAddress,
			token,
		);
		const parse = normalizer.parseUserTradingContext;

		const unsub = tradingWs.subscribe(channel, (raw) => {
			setContext(parse(raw));
		});

		return unsub;
	}, [normalizer, walletAddress, token, setContext]);
}
