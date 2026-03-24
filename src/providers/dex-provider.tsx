import { useWsConnection } from '@/hooks/use-ws-connection';
import { useDexPrices } from '@/hooks/use-dex-prices';
import { useDexActiveAsset } from '@/hooks/use-dex-active-asset';
import { useDexAllAssetCtxs } from '@/hooks/use-dex-all-asset-ctxs';
import { useDexOrderbook } from '@/hooks/use-dex-orderbook';
import { useDexTrades } from '@/hooks/use-dex-trades';
import { useDocumentTitle } from '@/hooks/use-document-title';

export function DexProvider({ children }: { children: React.ReactNode }) {
	useWsConnection();
	useDexPrices();
	useDexActiveAsset();
	useDexAllAssetCtxs();
	useDexOrderbook();
	useDexTrades();
	useDocumentTitle();

	return <>{children}</>;
}
