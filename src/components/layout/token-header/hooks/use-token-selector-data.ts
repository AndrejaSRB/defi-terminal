import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { assetMetaAtom } from '@/atoms/asset-meta';
import { allAssetCtxsAtom } from '@/atoms/all-asset-ctxs';
import { pricesAtom } from '@/atoms/prices';
import { activeNormalizerAtom } from '@/atoms/dex';
import { tokenFavoritesAtom } from '@/atoms/user/token-favorites';
import { parseTokenName } from '@/lib/token';

export interface TokenRow {
	symbol: string;
	displayName: string;
	dexName: string | null;
	imageUrl: string;
	leverage: string;
	markPrice: string;
	change24h: string;
	change24hValue: number;
	volume24h: string;
	openInterest: string;
	fundingRate: string;
	isFavorite: boolean;
}

export function useTokenSelectorData() {
	const meta = useAtomValue(assetMetaAtom);
	const ctxs = useAtomValue(allAssetCtxsAtom);
	const prices = useAtomValue(pricesAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);
	const favorites = useAtomValue(tokenFavoritesAtom);
	const [search, setSearch] = useState('');
	const [activeCategory, setActiveCategory] = useState('all');

	const tokens = useMemo(() => {
		const favSet = new Set(favorites);
		const rows: TokenRow[] = [];

		for (const [coin, assetMeta] of meta) {
			const ctx = ctxs.get(coin);
			const midPrice = prices[coin];
			const { formattedTokenName, dexName } = parseTokenName(coin);

			const mark = ctx
				? parseFloat(ctx.markPrice)
				: midPrice
					? parseFloat(midPrice)
					: 0;
			const prevDay = ctx ? parseFloat(ctx.prevDayPx) : 0;
			const change = prevDay > 0 ? ((mark - prevDay) / prevDay) * 100 : 0;
			const vol = ctx ? parseFloat(ctx.volume24h) : 0;
			const oi = ctx ? parseFloat(ctx.openInterest) : 0;
			const funding = ctx ? parseFloat(ctx.fundingRate) : 0;

			rows.push({
				symbol: coin,
				displayName: formattedTokenName,
				dexName,
				imageUrl: normalizer.getTokenImageUrl(coin),
				leverage: `${assetMeta.maxLeverage}x`,
				markPrice: mark > 0 ? normalizer.formatPrice(mark, coin) : '--',
				change24h: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
				change24hValue: change,
				volume24h: `$${vol.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
				openInterest: `$${oi.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
				fundingRate: `${(funding * 100).toFixed(4)}%`,
				isFavorite: favSet.has(coin),
			});
		}

		// Sort: favorites first, then by volume
		return rows.sort((tokenA, tokenB) => {
			if (tokenA.isFavorite !== tokenB.isFavorite) {
				return tokenA.isFavorite ? -1 : 1;
			}
			const volA = parseFloat(tokenA.volume24h.replace(/[$,]/g, '')) || 0;
			const volB = parseFloat(tokenB.volume24h.replace(/[$,]/g, '')) || 0;
			return volB - volA;
		});
	}, [meta, ctxs, prices, normalizer, favorites]);

	const filteredTokens = useMemo(() => {
		let result: TokenRow[];

		// Special "favorites" category
		if (activeCategory === 'favorites') {
			result = tokens.filter((token) => token.isFavorite);
		} else {
			const categoryFilter =
				normalizer.tokenCategories.find(
					(category) => category.id === activeCategory,
				)?.filter ?? (() => true);
			result = tokens.filter((token) => categoryFilter(token.symbol));
		}

		// Apply search filter
		if (search) {
			const query = search.toLowerCase();
			result = result.filter(
				(token) =>
					token.symbol.toLowerCase().includes(query) ||
					token.displayName.toLowerCase().includes(query),
			);
		}

		return result;
	}, [tokens, search, activeCategory, normalizer.tokenCategories]);

	return {
		tokens,
		filteredTokens,
		search,
		setSearch,
		activeCategory,
		setActiveCategory,
		categories: normalizer.tokenCategories,
	};
}
