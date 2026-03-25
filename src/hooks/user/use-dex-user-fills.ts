import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { userFillsAtom } from '@/atoms/user/fills';
import { useAuth } from '../use-auth';

const MAX_FILLS = 200;

export function useDexUserFills() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const { walletAddress } = useAuth();
	const setFills = useSetAtom(userFillsAtom);

	useEffect(() => {
		if (!walletAddress) {
			setFills([]);
			return;
		}

		if (!normalizer.channels.userFills || !normalizer.parseUserFills) return;

		const channel = normalizer.channels.userFills(walletAddress);
		const parse = normalizer.parseUserFills;
		let hasSnapshot = false;

		const unsub = tradingWs.subscribe(channel, (raw) => {
			const wsData = raw as { isSnapshot?: boolean; fills?: unknown[] };
			const fills = parse(wsData.fills ?? raw);

			if (wsData.isSnapshot || !hasSnapshot) {
				// First message or explicit snapshot — replace entirely
				hasSnapshot = true;
				setFills(fills.slice(0, MAX_FILLS));
			} else {
				// Live update — prepend new fills
				setFills((prev) => [...fills, ...prev].slice(0, MAX_FILLS));
			}
		});

		return unsub;
	}, [normalizer, walletAddress, setFills]);
}
