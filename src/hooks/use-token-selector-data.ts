import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { assetMetaAtom } from '@/atoms/asset-meta';
import { allAssetCtxsAtom } from '@/atoms/all-asset-ctxs';
import { pricesAtom } from '@/atoms/prices';
import { activeNormalizerAtom } from '@/atoms/dex';
import { parseTokenName } from '@/lib/token';

export interface TokenRow {
	symbol: string;
	displayName: string;
	dexName: string | null;
	leverage: string;
	markPrice: string;
	change24h: string;
	change24hValue: number;
	volume24h: string;
	openInterest: string;
	fundingRate: string;
}

export function useTokenSelectorData() {
	const meta = useAtomValue(assetMetaAtom);
	const ctxs = useAtomValue(allAssetCtxsAtom);
	const prices = useAtomValue(pricesAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);
	const [search, setSearch] = useState('');

	const tokens = useMemo(() => {
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
				leverage: `${assetMeta.maxLeverage}x`,
				markPrice: mark > 0 ? normalizer.formatPrice(mark, coin) : '--',
				change24h: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
				change24hValue: change,
				volume24h: `$${vol.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
				openInterest: `$${oi.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
				fundingRate: `${(funding * 100).toFixed(4)}%`,
			});
		}

		return rows.sort((a, b) => {
			const volA = parseFloat(a.volume24h.replace(/[$,]/g, '')) || 0;
			const volB = parseFloat(b.volume24h.replace(/[$,]/g, '')) || 0;
			return volB - volA;
		});
	}, [meta, ctxs, prices, normalizer]);

	const filteredTokens = useMemo(() => {
		if (!search) return tokens;
		const q = search.toLowerCase();
		return tokens.filter(
			(t) =>
				t.symbol.toLowerCase().includes(q) ||
				t.displayName.toLowerCase().includes(q),
		);
	}, [tokens, search]);

	return { tokens, filteredTokens, search, setSearch };
}
