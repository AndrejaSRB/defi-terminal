import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { userFundingsAtom } from '@/atoms/user/fundings';
import { useAuth } from '../use-auth';

const MAX_FUNDINGS = 500;

export function useDexUserFundings() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const { walletAddress } = useAuth();
	const setFundings = useSetAtom(userFundingsAtom);

	useEffect(() => {
		if (!walletAddress) {
			setFundings([]);
			return;
		}

		// WS path — HL
		if (normalizer.channels.userFundings && normalizer.parseUserFundings) {
			const channel = normalizer.channels.userFundings(walletAddress);
			const parse = normalizer.parseUserFundings;
			let hasSnapshot = false;

			const unsub = tradingWs.subscribe(channel, (raw) => {
				const wsData = raw as {
					isSnapshot?: boolean;
					fundings?: unknown[];
				};
				const fundings = parse(wsData.fundings ?? raw);

				if (wsData.isSnapshot || !hasSnapshot) {
					hasSnapshot = true;
					setFundings(fundings.reverse().slice(0, MAX_FUNDINGS));
				} else {
					setFundings((prev) => [...fundings, ...prev].slice(0, MAX_FUNDINGS));
				}
			});

			return unsub;
		}

		// REST fallback — Extended
		if (normalizer.fetchFundingHistory) {
			normalizer
				.fetchFundingHistory(walletAddress)
				.then((fundings) => setFundings(fundings))
				.catch(() => setFundings([]));
		}
	}, [normalizer, walletAddress, setFundings]);
}
