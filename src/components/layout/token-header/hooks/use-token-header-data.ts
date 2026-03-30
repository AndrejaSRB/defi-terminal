import { useMemo, useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeAssetDataAtom } from '@/atoms/active-asset';
import { allAssetCtxsAtom } from '@/atoms/all-asset-ctxs';
import { activeNormalizerAtom } from '@/atoms/dex';
import { parseTokenName } from '@/lib/token';
import { safeParseFloat } from '@/lib/numbers';
import { pricesAtom } from '@/atoms/prices';
import { formatCountdown, calculateFundingCountdown } from '@/lib/countdown';

export function useTokenHeaderData() {
	const token = useAtomValue(activeTokenAtom);
	const wsAsset = useAtomValue(activeAssetDataAtom);
	const allCtxs = useAtomValue(allAssetCtxsAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);
	const prices = useAtomValue(pricesAtom);

	// Live funding countdown — ticks every second
	const [fundingSeconds, setFundingSeconds] = useState(
		calculateFundingCountdown,
	);

	useEffect(() => {
		const interval = setInterval(() => {
			setFundingSeconds(calculateFundingCountdown());
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	return useMemo(() => {
		const { formattedTokenName, dexName } = parseTokenName(token);
		const asset = wsAsset ?? allCtxs.get(token) ?? null;

		if (!asset) {
			return {
				symbol: formattedTokenName,
				dexName,
				markPriceRaw: 0,
				markPrice: '--',
				oraclePrice: '--',
				change24h: '--',
				change24hValue: 0,
				changePx: '--',
				volume24h: '--',
				openInterest: '--',
				fundingRate: '--',
				fundingCountdown: '--',
				isLoading: true,
			};
		}

		const mark = safeParseFloat(prices[token], safeParseFloat(asset.markPrice));
		const oracle = safeParseFloat(asset.oraclePrice);
		const prevDay = safeParseFloat(asset.prevDayPx);
		const vol = safeParseFloat(asset.volume24h);
		const oi = safeParseFloat(asset.openInterest);
		const funding = safeParseFloat(asset.fundingRate);

		const changeValue = prevDay > 0 ? ((mark - prevDay) / prevDay) * 100 : 0;
		const changePxValue = mark - prevDay;

		return {
			symbol: formattedTokenName,
			dexName,
			markPriceRaw: mark,
			markPrice: normalizer.formatPrice(mark, token),
			oraclePrice: normalizer.formatPrice(oracle, token),
			change24h: `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(2)}%`,
			change24hValue: changeValue,
			changePx: normalizer.formatPrice(Math.abs(changePxValue), token),
			volume24h: `$${vol.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			openInterest: `$${oi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			fundingRate: `${(funding * 100).toFixed(4)}%`,
			fundingCountdown: formatCountdown(fundingSeconds),
			isLoading: false,
		};
	}, [token, wsAsset, allCtxs, normalizer, prices, fundingSeconds]);
}
