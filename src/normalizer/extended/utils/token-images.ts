const CDN_URL = 'https://cdn.extended.exchange/crypto';

// Module-level cache: market name → assetName (e.g. "BTC-USD" → "BTC")
const assetNameMap = new Map<string, string>();

/** Called from init() to populate the asset name mapping */
export function setAssetNames(markets: { name: string; assetName: string }[]) {
	assetNameMap.clear();
	for (const market of markets) {
		assetNameMap.set(market.name, market.assetName);
	}
}

export function extGetTokenImageUrl(coin: string): string {
	const assetName = assetNameMap.get(coin) ?? coin.split('-')[0];
	return `${CDN_URL}/${assetName}.svg`;
}
