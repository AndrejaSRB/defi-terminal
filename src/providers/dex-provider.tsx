import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { useWsConnection } from '@/hooks/market/use-ws-connection';
import { useDexPrices } from '@/hooks/market/use-dex-prices';
import { useDexActiveAsset } from '@/hooks/market/use-dex-active-asset';
import { useDexAllAssetCtxs } from '@/hooks/market/use-dex-all-asset-ctxs';
import { useDexOrderbook } from '@/hooks/market/use-dex-orderbook';
import { useDexTrades } from '@/hooks/market/use-dex-trades';
import { useDexUserPositions } from '@/hooks/user/use-dex-user-positions';
import { useDexUserOrders } from '@/hooks/user/use-dex-user-orders';
import { useDexUserFills } from '@/hooks/user/use-dex-user-fills';
import { useDexUserBalances } from '@/hooks/user/use-dex-user-balances';
import { useDexUserSpot } from '@/hooks/user/use-dex-user-spot';
import { useDexUserFundings } from '@/hooks/user/use-dex-user-fundings';
import { useDexUserOrderHistory } from '@/hooks/user/use-dex-user-order-history';
import { useDexUserTradingContext } from '@/hooks/user/use-dex-user-trading-context';
import { useDexUserData } from '@/hooks/user/use-dex-user-data';
import { useDexUserLeverage } from '@/hooks/user/use-dex-user-leverage';
import { useSyncWalletAddress } from '@/hooks/user/use-sync-wallet-address';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { activeDexIdAtom } from '@/atoms/dex';
import { warmupSigner } from '@/normalizer/extended/services/signer-warmup';
import {
	checkAbstractionMode,
	validateAgent,
} from '@/normalizer/hyperliquid/onboarding';
import { useAuth } from '@/hooks/use-auth';

export function DexProvider({ children }: { children: React.ReactNode }) {
	const dexId = useAtomValue(activeDexIdAtom);
	const { walletAddress } = useAuth();

	if (dexId === 'extended') {
		warmupSigner();
	}

	// Validate agent + check HIP-3 abstraction mode when HL wallet connects
	useEffect(() => {
		if (dexId === 'hyperliquid' && walletAddress) {
			validateAgent(walletAddress);
			checkAbstractionMode(walletAddress);
		}
	}, [dexId, walletAddress]);

	useWsConnection();
	useSyncWalletAddress();
	useDexPrices();
	useDexActiveAsset();
	useDexAllAssetCtxs();
	useDexOrderbook();
	useDexTrades();
	useDexUserPositions();
	useDexUserOrders();
	useDexUserFills();
	useDexUserBalances();
	useDexUserSpot();
	useDexUserFundings();
	useDexUserOrderHistory();
	useDexUserTradingContext();
	useDexUserData();
	useDexUserLeverage();
	useDocumentTitle();

	return <>{children}</>;
}
