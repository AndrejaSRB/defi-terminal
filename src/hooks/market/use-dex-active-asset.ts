import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeAssetDataAtom } from '@/atoms/active-asset';

export function useDexActiveAsset() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const token = useAtomValue(activeTokenAtom);
	const setActiveAsset = useSetAtom(activeAssetDataAtom);

	useEffect(() => {
		if (!normalizer.channels.activeAsset) {
			// No per-token WS channel (e.g. Extended).
			// Header falls back to allAssetCtxs (REST) + prices (global WS).
			setActiveAsset(null);
			return;
		}

		const channel = normalizer.channels.activeAsset(token);
		const unsub = tradingWs.subscribe(channel, (raw) => {
			setActiveAsset(normalizer.parseActiveAsset(raw));
		});
		return unsub;
	}, [normalizer, token, setActiveAsset]);
}
