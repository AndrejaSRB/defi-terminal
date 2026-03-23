import { useWsConnection } from '@/hooks/use-ws-connection';
import { useDexPrices } from '@/hooks/use-dex-prices';
import { useDexActiveAsset } from '@/hooks/use-dex-active-asset';
import { useDexOrderbook } from '@/hooks/use-dex-orderbook';
import { useDexTrades } from '@/hooks/use-dex-trades';
import { useDocumentTitle } from '@/hooks/use-document-title';

export function DexProvider({ children }: { children: React.ReactNode }) {
	useWsConnection();
	useDexPrices();
	useDexActiveAsset();
	useDexOrderbook();
	useDexTrades();
	useDocumentTitle();

	return <>{children}</>;
}
