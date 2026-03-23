import { useWsConnection } from '@/hooks/use-ws-connection';
import { useDexPrices } from '@/hooks/use-dex-prices';

export function DexProvider({ children }: { children: React.ReactNode }) {
	useWsConnection();
	useDexPrices();

	return <>{children}</>;
}
