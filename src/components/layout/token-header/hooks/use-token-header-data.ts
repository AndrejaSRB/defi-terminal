import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeAssetDataAtom } from '@/atoms/active-asset';
import { allAssetCtxsAtom } from '@/atoms/all-asset-ctxs';
import { activeNormalizerAtom } from '@/atoms/dex';
import { parseTokenName } from '@/lib/token';
import { pricesAtom } from '@/atoms/prices';

export function useTokenHeaderData() {
	const token = useAtomValue(activeTokenAtom);
	const wsAsset = useAtomValue(activeAssetDataAtom);
	const allCtxs = useAtomValue(allAssetCtxsAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);
	const prices = useAtomValue(pricesAtom);

	return useMemo(() => {
		const { formattedTokenName, dexName } = parseTokenName(token);
		const asset = wsAsset ?? allCtxs.get(token) ?? null;

		if (!asset) {
			return {
				symbol: formattedTokenName,
				dexName,
				markPrice: '--',
				oraclePrice: '--',
				change24h: '--',
				change24hValue: 0,
				changePx: '--',
				volume24h: '--',
				openInterest: '--',
				fundingRate: '--',
				fundingInterval: '--',
				isLoading: true,
			};
		}

		const mark = parseFloat(prices[token]);
		const oracle = parseFloat(asset.oraclePrice);
		const prevDay = parseFloat(asset.prevDayPx);
		const vol = parseFloat(asset.volume24h);
		const oi = parseFloat(asset.openInterest);
		const funding = parseFloat(asset.fundingRate);

		const changeValue = prevDay > 0 ? ((mark - prevDay) / prevDay) * 100 : 0;
		const changePxValue = mark - prevDay;

		return {
			symbol: formattedTokenName,
			dexName,
			markPrice: normalizer.formatPrice(mark, token),
			oraclePrice: normalizer.formatPrice(oracle, token),
			change24h: `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(2)}%`,
			change24hValue: changeValue,
			changePx: normalizer.formatPrice(Math.abs(changePxValue), token),
			volume24h: `$${vol.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
			openInterest: `$${oi.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
			fundingRate: `${(funding * 100).toFixed(4)}%`,
			fundingInterval: asset.fundingInterval,
			isLoading: false,
		};
	}, [token, wsAsset, allCtxs, normalizer]);
}
