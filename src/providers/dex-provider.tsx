import { useWsConnection } from '@/hooks/use-ws-connection';
import { useDexPrices } from '@/hooks/use-dex-prices';
import { useDexActiveAsset } from '@/hooks/use-dex-active-asset';
import { useDocumentTitle } from '@/hooks/use-document-title';

export function DexProvider({ children }: { children: React.ReactNode }) {
	useWsConnection();
	useDexPrices();
	useDexActiveAsset();
	useDocumentTitle();

	return <>{children}</>;
}
