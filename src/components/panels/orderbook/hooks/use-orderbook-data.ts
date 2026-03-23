import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeNormalizerAtom } from '@/atoms/dex';
import { orderBookByTokenAtom } from '@/atoms/market-data/orderbook';
import { denominationAtom } from '@/atoms/market-data/denomination';

const NO_DOLLAR = { hasDollarSign: false };

export interface FormattedLevel {
	price: string;
	size: string;
	total: string;
	depthPercent: number;
	rawPrice: number;
	side: 'bid' | 'ask';
}

export function useOrderbookData(maxLevels = 20) {
	const token = useAtomValue(activeTokenAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);
	const { status, data: book } = useAtomValue(orderBookByTokenAtom(token));
	const denom = useAtomValue(denominationAtom);
	const isUsd = denom === 'usd';

	return useMemo(() => {
		const asks = book.asks.slice(0, maxLevels);
		const bids = book.bids.slice(0, maxLevels);

		const formatSize = (size: number, price: number) => {
			if (isUsd) {
				const usdValue = size * price;
				return usdValue.toLocaleString('en-US', {
					maximumFractionDigits: 2,
				});
			}
			return normalizer.formatSize(size, token);
		};

		let askCumulative = 0;
		let askCumulativeUsd = 0;
		const formattedAsks: FormattedLevel[] = asks
			.map((level): FormattedLevel => {
				askCumulative += level.size;
				askCumulativeUsd += level.size * level.price;
				return {
					price: normalizer.formatPrice(level.price, token, NO_DOLLAR),
					size: formatSize(level.size, level.price),
					total: isUsd
						? askCumulativeUsd.toLocaleString('en-US', {
								maximumFractionDigits: 2,
							})
						: normalizer.formatSize(askCumulative, token),
					depthPercent: 0,
					rawPrice: level.price,
					side: 'ask',
				};
			})
			.reverse();

		let bidCumulative = 0;
		let bidCumulativeUsd = 0;
		const formattedBids: FormattedLevel[] = bids.map(
			(level): FormattedLevel => {
				bidCumulative += level.size;
				bidCumulativeUsd += level.size * level.price;
				return {
					price: normalizer.formatPrice(level.price, token, NO_DOLLAR),
					size: formatSize(level.size, level.price),
					total: isUsd
						? bidCumulativeUsd.toLocaleString('en-US', {
								maximumFractionDigits: 2,
							})
						: normalizer.formatSize(bidCumulative, token),
					depthPercent: 0,
					rawPrice: level.price,
					side: 'bid',
				};
			},
		);

		const maxTotal = isUsd
			? Math.max(askCumulativeUsd, bidCumulativeUsd)
			: Math.max(askCumulative, bidCumulative);
		if (maxTotal > 0) {
			let runningAsk = 0;
			for (let i = formattedAsks.length - 1; i >= 0; i--) {
				const level = asks[formattedAsks.length - 1 - i];
				runningAsk += isUsd
					? (level?.size ?? 0) * (level?.price ?? 0)
					: (level?.size ?? 0);
				formattedAsks[i].depthPercent = (runningAsk / maxTotal) * 100;
			}
			let runningBid = 0;
			for (let i = 0; i < formattedBids.length; i++) {
				const level = bids[i];
				runningBid += isUsd
					? (level?.size ?? 0) * (level?.price ?? 0)
					: (level?.size ?? 0);
				formattedBids[i].depthPercent = (runningBid / maxTotal) * 100;
			}
		}

		const bestAsk = asks[0]?.price ?? 0;
		const bestBid = bids[0]?.price ?? 0;
		const spreadValue = bestAsk - bestBid;
		const spreadPct = bestBid > 0 ? (spreadValue / bestBid) * 100 : 0;

		return {
			asks: formattedAsks,
			bids: formattedBids,
			spread: {
				value:
					spreadValue > 0
						? normalizer.formatPrice(spreadValue, token, NO_DOLLAR)
						: '--',
				percentage: spreadValue > 0 ? `${spreadPct.toFixed(3)}%` : '--',
			},
			isLoading: status !== 'live',
		};
	}, [book, token, normalizer, status, maxLevels, isUsd]);
}
