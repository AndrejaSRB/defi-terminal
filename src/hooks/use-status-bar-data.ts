import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { connectionStateAtom } from '@/atoms/connection';
import { activeNormalizerAtom } from '@/atoms/dex';

export function useStatusBarData() {
	const connectionState = useAtomValue(connectionStateAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);

	return useMemo(() => {
		const statusMap = {
			connected: 'online',
			connecting: 'connecting',
			reconnecting: 'connecting',
			disconnected: 'offline',
		} as const;

		return {
			connectionStatus: statusMap[connectionState],
			dexName: normalizer.name,
		};
	}, [connectionState, normalizer]);
}
