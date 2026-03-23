import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { assetMetaAtom } from '@/atoms/asset-meta';
import { connectionStateAtom } from '@/atoms/connection';

export function useWsConnection() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const setAssetMeta = useSetAtom(assetMetaAtom);
	const setConnectionState = useSetAtom(connectionStateAtom);

	useEffect(() => {
		let cancelled = false;

		normalizer.init().then((meta) => {
			if (cancelled) return;
			setAssetMeta(meta);
			tradingWs.connect();
		});

		const unsubState = tradingWs.onStateChange(setConnectionState);

		return () => {
			cancelled = true;
			unsubState();
			tradingWs.disconnect();
		};
	}, [normalizer, setAssetMeta, setConnectionState]);
}
