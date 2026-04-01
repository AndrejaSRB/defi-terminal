import { useEffect } from 'react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { tradingWs, configureDexWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { assetMetaAtom } from '@/atoms/asset-meta';
import { connectionStateAtom } from '@/atoms/connection';
import { allAssetCtxsAtom } from '@/atoms/all-asset-ctxs';
import { pricesAtom } from '@/atoms/prices';
import { activeTokenAtom } from '@/atoms/active-token';
import { userTradingContextAtom } from '@/atoms/user/trading-context';
import {
	userMarginAtom,
	userPerpsBalancesAtom,
	userSpotBalancesAtom,
} from '@/atoms/user/balances';
import { userPositionsAtom } from '@/atoms/user/positions';
import { userOpenOrdersAtom } from '@/atoms/user/orders';
import { userFillsAtom } from '@/atoms/user/fills';
import { userOrderHistoryAtom } from '@/atoms/user/order-history';
import { userFundingsAtom } from '@/atoms/user/fundings';

export function useWsConnection() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const setAssetMeta = useSetAtom(assetMetaAtom);
	const setConnectionState = useSetAtom(connectionStateAtom);
	const setAllAssetCtxs = useSetAtom(allAssetCtxsAtom);
	const setPrices = useSetAtom(pricesAtom);
	const store = useStore();

	useEffect(() => {
		let cancelled = false;

		// Navigate to the DEX's default token
		store.set(activeTokenAtom, normalizer.defaultToken);
		window.history.replaceState(null, '', `/${normalizer.defaultToken}`);

		// Clear stale data from previous DEX
		setAssetMeta(new Map());
		setAllAssetCtxs(new Map());
		setPrices({});
		store.set(userTradingContextAtom, null);
		store.set(userMarginAtom, null);
		store.set(userPositionsAtom, []);
		store.set(userOpenOrdersAtom, []);
		store.set(userFillsAtom, []);
		store.set(userOrderHistoryAtom, []);
		store.set(userFundingsAtom, []);
		store.set(userPerpsBalancesAtom, []);
		store.set(userSpotBalancesAtom, []);

		// Configure protocol SYNCHRONOUSLY so other hooks' subscriptions use correct keys
		configureDexWs(normalizer);

		(async () => {
			try {
				const meta = await normalizer.init();
				if (cancelled) return;
				setAssetMeta(meta);

				const assetCtxs = await normalizer.fetchAllAssetCtxs();
				if (cancelled) return;
				setAllAssetCtxs(assetCtxs);

				tradingWs.connect();
			} catch (e) {
				console.error('[WsConnection] Init failed:', e);
			}
		})();

		const unsubState = tradingWs.onStateChange(setConnectionState);

		return () => {
			cancelled = true;
			unsubState();
			tradingWs.disconnect();
		};
	}, [normalizer, setAssetMeta, setConnectionState, setAllAssetCtxs]);
}
