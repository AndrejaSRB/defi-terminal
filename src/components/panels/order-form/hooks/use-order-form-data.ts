import { useDeferredValue, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeNormalizerAtom } from '@/atoms/dex';
import { useAuth } from '@/hooks/use-auth';
import { safeParseFloat } from '@/lib/numbers';
import { safeFormatPrice, safeFormatSize } from '@/lib/format';
import {
	orderSideAtom,
	orderTypeAtom,
	limitPriceAtom,
	sizeAtom,
	sizeDenomAtom,
	reduceOnlyAtom,
	marginModeAtom,
	leverageAtom,
	tpslEnabledAtom,
	tpToggleAtom,
	slToggleAtom,
	slippageAtom,
} from '../atoms/order-form-atoms';
import {
	availableToTradeAtom,
	activePositionAtom,
	activeMetaAtom,
	markPriceAtom,
	orderValueAtom,
	marginRequiredAtom,
	estLiquidationPriceAtom,
	priceDecimalsAtom,
	liveTpPriceAtom,
	liveTpGainAtom,
	liveSlPriceAtom,
	liveSlLossAtom,
	sliderPercentDerivedAtom,
} from '../atoms/order-form-derived';

export interface OrderFormData {
	token: string;
	markPrice: string;
	side: 'long' | 'short';
	orderType: 'market' | 'limit';
	limitPrice: string;
	size: string;
	sizeDenom: 'coin' | 'usd';
	sliderPercent: number;
	reduceOnly: boolean;
	marginMode: 'cross' | 'isolated';
	leverage: number;
	availableMargin: string;
	currentPosition: { size: string; side: string } | null;

	tpslEnabled: boolean;
	tpPrice: string;
	tpGain: string;
	tpToggle: 'usd' | 'pct';
	slPrice: string;
	slLoss: string;
	slToggle: 'usd' | 'pct';

	szDecimals: number;
	priceDecimals: number;
	isReady: boolean;

	submitState:
		| 'connect'
		| 'deposit'
		| 'place-trade'
		| 'not-enough-margin'
		| 'enter-size'
		| 'no-position';
	info: {
		liquidationPrice: string;
		orderValue: string;
		marginRequired: string;
		slippage: string;
		fees: string;
	};
}

export function useOrderFormData(): OrderFormData {
	const { isAuthenticated } = useAuth();
	const normalizer = useAtomValue(activeNormalizerAtom);
	const token = useAtomValue(activeTokenAtom);

	const side = useAtomValue(orderSideAtom);
	const orderType = useAtomValue(orderTypeAtom);
	const limitPrice = useAtomValue(limitPriceAtom);
	const size = useAtomValue(sizeAtom);
	const sizeDenom = useAtomValue(sizeDenomAtom);
	const reduceOnly = useAtomValue(reduceOnlyAtom);
	const marginMode = useAtomValue(marginModeAtom);
	const leverage = useAtomValue(leverageAtom);

	const tpslEnabled = useAtomValue(tpslEnabledAtom);
	const tpPrice = useAtomValue(liveTpPriceAtom);
	const tpGain = useAtomValue(liveTpGainAtom);
	const tpToggle = useAtomValue(tpToggleAtom);
	const slPrice = useAtomValue(liveSlPriceAtom);
	const slLoss = useAtomValue(liveSlLossAtom);
	const slToggle = useAtomValue(slToggleAtom);

	const markPriceRaw = useAtomValue(markPriceAtom);
	const availableMarginRaw = useAtomValue(availableToTradeAtom);
	const position = useAtomValue(activePositionAtom);
	const meta = useAtomValue(activeMetaAtom);
	const orderValueRaw = useDeferredValue(useAtomValue(orderValueAtom));
	const marginRequiredRaw = useDeferredValue(useAtomValue(marginRequiredAtom));
	const sliderPercent = useAtomValue(sliderPercentDerivedAtom);
	const priceDecimals = useAtomValue(priceDecimalsAtom);
	const estLiqPrice = useDeferredValue(useAtomValue(estLiquidationPriceAtom));
	const slippage = useAtomValue(slippageAtom);

	return useMemo(() => {
		const sizeNum = safeParseFloat(size);

		const submitState: OrderFormData['submitState'] = (() => {
			if (!isAuthenticated) return 'connect';
			if (availableMarginRaw <= 0) return 'deposit';
			if (reduceOnly && !position) return 'no-position';
			if (sizeNum <= 0) return 'enter-size';
			if (!reduceOnly && marginRequiredRaw > availableMarginRaw)
				return 'not-enough-margin';
			return 'place-trade';
		})();

		const currentPosition = position
			? {
					size: safeFormatSize(
						normalizer,
						safeParseFloat(position.size),
						position.coin,
					),
					side: position.side,
				}
			: null;

		return {
			token,
			markPrice:
				markPriceRaw > 0
					? safeFormatPrice(normalizer, markPriceRaw, token)
					: '--',
			side,
			orderType,
			limitPrice,
			size,
			sizeDenom,
			sliderPercent,
			reduceOnly,
			marginMode,
			leverage,
			availableMargin: `$${availableMarginRaw.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
			currentPosition,
			tpslEnabled,
			tpPrice,
			tpGain,
			tpToggle,
			slPrice,
			slLoss,
			slToggle,
			szDecimals: meta?.szDecimals ?? 2,
			priceDecimals,
			isReady: markPriceRaw > 0,
			submitState,
			info: {
				liquidationPrice:
					estLiqPrice > 0
						? safeFormatPrice(normalizer, estLiqPrice, token)
						: 'N/A',
				orderValue:
					orderValueRaw > 0
						? `$${orderValueRaw.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
						: 'N/A',
				marginRequired:
					marginRequiredRaw > 0
						? `$${marginRequiredRaw.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
						: 'N/A',
				slippage: `${slippage.toFixed(1)}%`,
				fees: '0%',
			},
		};
	}, [
		isAuthenticated,
		normalizer,
		token,
		side,
		orderType,
		limitPrice,
		size,
		sizeDenom,
		sliderPercent,
		reduceOnly,
		marginMode,
		leverage,
		markPriceRaw,
		availableMarginRaw,
		position,
		meta,
		priceDecimals,
		estLiqPrice,
		orderValueRaw,
		marginRequiredRaw,
		tpslEnabled,
		tpPrice,
		tpGain,
		tpToggle,
		slPrice,
		slLoss,
		slToggle,
		slippage,
	]);
}
