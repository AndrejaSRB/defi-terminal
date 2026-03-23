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
		const channel = normalizer.channels.activeAsset(token);
		const unsub = tradingWs.subscribe(channel, (raw) => {
			setActiveAsset(normalizer.parseActiveAsset(raw));
		});
		return unsub;
	}, [normalizer, token, setActiveAsset]);
}
