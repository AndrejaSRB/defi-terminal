import { useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { allAssetCtxsAtom } from '@/atoms/all-asset-ctxs';

export function useDexAllAssetCtxs() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const setAllAssetCtxs = useSetAtom(allAssetCtxsAtom);
	const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		// WS path — DEX supports live asset ctxs channel
		if (normalizer.channels.allAssetCtxs && normalizer.parseAllAssetCtxs) {
			const channel = normalizer.channels.allAssetCtxs();
			const parse = normalizer.parseAllAssetCtxs;
			const unsub = tradingWs.subscribe(channel, (raw) => {
				setAllAssetCtxs(parse(raw));
			});
			return unsub;
		}

		// REST fallback — poll every 30s
		const poll = async () => {
			try {
				const ctxs = await normalizer.fetchAllAssetCtxs();
				setAllAssetCtxs(ctxs);
			} catch (e) {
				console.error('[AllAssetCtxs] Poll failed:', e);
			}
		};
		poll();
		pollingRef.current = setInterval(poll, 30_000);

		return () => {
			if (pollingRef.current) {
				clearInterval(pollingRef.current);
				pollingRef.current = null;
			}
		};
	}, [normalizer, setAllAssetCtxs]);
}
