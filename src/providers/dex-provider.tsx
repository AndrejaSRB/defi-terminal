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
import { useDocumentTitle } from '@/hooks/use-document-title';

export function DexProvider({ children }: { children: React.ReactNode }) {
	useWsConnection();
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
	useDocumentTitle();

	return <>{children}</>;
}
