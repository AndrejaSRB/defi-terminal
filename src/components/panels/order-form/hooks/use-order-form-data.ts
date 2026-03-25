import { useDeferredValue, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeNormalizerAtom } from '@/atoms/dex';
import { useAuth } from '@/hooks/use-auth';
import { safeParseFloat } from '@/lib/numbers';
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
	tpPriceAtom,
	tpGainAtom,
	tpToggleAtom,
	slPriceAtom,
	slLossAtom,
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

	submitState:
		| 'connect'
		| 'deposit'
		| 'place-trade'
		| 'not-enough-margin'
		| 'enter-size';
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
	const tpPrice = useAtomValue(tpPriceAtom);
	const tpGain = useAtomValue(tpGainAtom);
	const tpToggle = useAtomValue(tpToggleAtom);
	const slPrice = useAtomValue(slPriceAtom);
	const slLoss = useAtomValue(slLossAtom);
	const slToggle = useAtomValue(slToggleAtom);

	const markPriceRaw = useAtomValue(markPriceAtom);
	const availableMarginRaw = useAtomValue(availableToTradeAtom);
	const position = useAtomValue(activePositionAtom);
	const meta = useAtomValue(activeMetaAtom);
	const orderValueRaw = useDeferredValue(useAtomValue(orderValueAtom));
	const marginRequiredRaw = useDeferredValue(useAtomValue(marginRequiredAtom));
	const sliderPercent = useAtomValue(sliderPercentDerivedAtom);
	const estLiqPrice = useDeferredValue(useAtomValue(estLiquidationPriceAtom));
	const slippage = useAtomValue(slippageAtom);

	return useMemo(() => {
		const sizeNum = safeParseFloat(size);

		const submitState: OrderFormData['submitState'] = (() => {
			if (!isAuthenticated) return 'connect';
			if (availableMarginRaw <= 0) return 'deposit';
			if (sizeNum <= 0) return 'enter-size';
			if (!reduceOnly && marginRequiredRaw > availableMarginRaw)
				return 'not-enough-margin';
			return 'place-trade';
		})();

		const currentPosition = position
			? {
					size: normalizer.formatSize(
						safeParseFloat(position.size),
						position.coin,
					),
					side: position.side,
				}
			: null;

		return {
			token,
			markPrice:
				markPriceRaw > 0 ? normalizer.formatPrice(markPriceRaw, token) : '--',
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
			submitState,
			info: {
				liquidationPrice:
					estLiqPrice > 0 ? normalizer.formatPrice(estLiqPrice, token) : 'N/A',
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
