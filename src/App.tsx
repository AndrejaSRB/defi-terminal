import { useAtomValue } from 'jotai';
import { connectionStateAtom } from '@/atoms/connection';
import { pricesAtom } from '@/atoms/prices';
import { assetMetaAtom } from '@/atoms/asset-meta';

function App() {
	const connectionState = useAtomValue(connectionStateAtom);
	const prices = useAtomValue(pricesAtom);
	const assetMeta = useAtomValue(assetMetaAtom);

	const priceCount = Object.keys(prices).length;
	const btcPrice = prices['BTC'] ?? '--';
	const ethPrice = prices['ETH'] ?? '--';

	return (
		<div className="p-6 font-mono">
			<h1 className="text-xl font-bold mb-4">Trading Terminal — Debug</h1>

			<div className="space-y-2 text-sm">
				<p>
					Connection:{' '}
					<span
						className={
							connectionState === 'connected'
								? 'text-green-400'
								: 'text-yellow-400'
						}
					>
						{connectionState}
					</span>
				</p>
				<p>Assets loaded: {assetMeta.size}</p>
				<p>Prices streaming: {priceCount} coins</p>
				<p>BTC: {btcPrice}</p>
				<p>ETH: {ethPrice}</p>
			</div>
		</div>
	);
}

export default App;
