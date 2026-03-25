import { useCallback, useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { toast } from 'sonner';
import { activeTokenAtom } from '@/atoms/active-token';
import { safeParseFloat } from '@/lib/numbers';
import {
	orderSideAtom,
	orderTypeAtom,
	limitPriceAtom,
	sizeAtom,
	sizeDenomAtom,
	sliderPercentAtom,
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
} from '../atoms/order-form-atoms';
import {
	availableToTradeAtom,
	activePositionAtom,
	activeMetaAtom,
	markPriceAtom,
	effectivePriceAtom,
	maxSizeInCoinAtom,
	serverLeverageAtom,
	serverMarginModeAtom,
} from '../atoms/order-form-derived';
import { validateOrderForm } from '../validators/order-form-validators';
import type { OrderFormValues } from '../validators/types';

export interface OrderFormActions {
	setSide: (side: 'long' | 'short') => void;
	setOrderType: (type: 'market' | 'limit') => void;
	setLimitPrice: (value: string) => void;
	setSize: (value: string) => void;
	setSizeDenom: (denom: 'coin' | 'usd') => void;
	setSliderPercent: (percent: number) => void;
	setReduceOnly: (checked: boolean) => void;
	setMarginMode: (mode: 'cross' | 'isolated') => void;
	setLeverage: (value: number) => void;
	toggleTpsl: () => void;
	setTpPrice: (value: string) => void;
	setTpGain: (value: string) => void;
	setTpToggle: (toggle: 'usd' | 'pct') => void;
	setSlPrice: (value: string) => void;
	setSlLoss: (value: string) => void;
	setSlToggle: (toggle: 'usd' | 'pct') => void;
	handleSubmit: () => void;
}

export function useOrderFormActions(): OrderFormActions {
	const store = useStore();
	const token = useAtomValue(activeTokenAtom);
	const prevTokenRef = useRef(token);

	const setSide = useSetAtom(orderSideAtom);
	const setOrderTypeAtom = useSetAtom(orderTypeAtom);
	const setLimitPrice = useSetAtom(limitPriceAtom);
	const setSize = useSetAtom(sizeAtom);
	const setSizeDenom = useSetAtom(sizeDenomAtom);
	const setSliderPercentAtom = useSetAtom(sliderPercentAtom);
	const setReduceOnly = useSetAtom(reduceOnlyAtom);
	const setMarginMode = useSetAtom(marginModeAtom);
	const setLeverage = useSetAtom(leverageAtom);
	const setTpslEnabled = useSetAtom(tpslEnabledAtom);
	const setTpPrice = useSetAtom(tpPriceAtom);
	const setTpGain = useSetAtom(tpGainAtom);
	const setTpToggle = useSetAtom(tpToggleAtom);
	const setSlPrice = useSetAtom(slPriceAtom);
	const setSlLoss = useSetAtom(slLossAtom);
	const setSlToggle = useSetAtom(slToggleAtom);

	const resetForm = useCallback(() => {
		setSize('');
		setLimitPrice('');
		setSliderPercentAtom(0);
		setReduceOnly(false);
		setTpslEnabled(false);
		setTpPrice('');
		setTpGain('');
		setSlPrice('');
		setSlLoss('');
	}, [
		setSize,
		setLimitPrice,
		setSliderPercentAtom,
		setReduceOnly,
		setTpslEnabled,
		setTpPrice,
		setTpGain,
		setSlPrice,
		setSlLoss,
	]);

	// Reset form on token switch
	useEffect(() => {
		if (prevTokenRef.current !== token) {
			prevTokenRef.current = token;
			resetForm();
		}
	}, [token, resetForm]);

	// Sync form atoms from server trading context
	const serverLeverage = useAtomValue(serverLeverageAtom);
	const serverMode = useAtomValue(serverMarginModeAtom);

	useEffect(() => {
		if (serverLeverage !== null) setLeverage(serverLeverage);
	}, [serverLeverage, setLeverage]);

	useEffect(() => {
		if (serverMode !== null) setMarginMode(serverMode);
	}, [serverMode, setMarginMode]);

	const setOrderType = useCallback(
		(type: 'market' | 'limit') => {
			setOrderTypeAtom(type);
			// Auto-fill limit price from mark when switching to limit
			if (type === 'limit') {
				const currentLimit = store.get(limitPriceAtom);
				if (!currentLimit) {
					const mark = store.get(markPriceAtom);
					if (mark > 0) setLimitPrice(mark.toString());
				}
			}
		},
		[setOrderTypeAtom, setLimitPrice, store],
	);

	const setSliderPercent = useCallback(
		(percent: number) => {
			setSliderPercentAtom(percent);
			const maxSize = store.get(maxSizeInCoinAtom);
			const price = store.get(effectivePriceAtom);
			const denom = store.get(sizeDenomAtom);
			const coinSize = (percent / 100) * maxSize;

			if (denom === 'coin') {
				setSize(coinSize > 0 ? coinSize.toPrecision(6) : '');
			} else {
				const usdSize = coinSize * price;
				setSize(usdSize > 0 ? usdSize.toFixed(2) : '');
			}
		},
		[setSliderPercentAtom, setSize, store],
	);

	const toggleTpsl = useCallback(() => {
		setTpslEnabled((prev) => !prev);
	}, [setTpslEnabled]);

	const handleSubmit = useCallback(() => {
		const side = store.get(orderSideAtom);
		const type = store.get(orderTypeAtom);
		const mark = store.get(markPriceAtom);
		const margin = store.get(availableToTradeAtom);
		const leverage = store.get(leverageAtom);
		const position = store.get(activePositionAtom);
		const meta = store.get(activeMetaAtom);
		const reduceOnly = store.get(reduceOnlyAtom);
		const tpslEnabled = store.get(tpslEnabledAtom);
		const sizeRaw = store.get(sizeAtom);
		const denom = store.get(sizeDenomAtom);
		const price = store.get(effectivePriceAtom);

		let sizeInCoin = safeParseFloat(sizeRaw);
		if (denom === 'usd' && price > 0) {
			sizeInCoin = sizeInCoin / price;
		}

		const values: OrderFormValues = {
			side,
			type,
			limitPrice: safeParseFloat(store.get(limitPriceAtom)),
			size: sizeInCoin,
			markPrice: mark,
			availableMargin: margin,
			leverage,
			reduceOnly,
			currentPositionSize: position ? safeParseFloat(position.size) : 0,
			currentPositionSide: position ? position.side : null,
			szDecimals: meta?.szDecimals ?? 2,
			maxLeverage: meta?.maxLeverage ?? 50,
			tpslEnabled,
			tpPrice: safeParseFloat(store.get(tpPriceAtom)),
			slPrice: safeParseFloat(store.get(slPriceAtom)),
		};

		const result = validateOrderForm(values);
		if (!result.valid) {
			for (const error of result.errors) {
				toast.error(error.message);
			}
			return;
		}

		// Static form — no actual placement yet
		toast.success('Order form is valid');
	}, [store]);

	return {
		setSide,
		setOrderType,
		setLimitPrice,
		setSize,
		setSizeDenom,
		setSliderPercent,
		setReduceOnly,
		setMarginMode,
		setLeverage,
		toggleTpsl,
		setTpPrice,
		setTpGain,
		setTpToggle,
		setSlPrice,
		setSlLoss,
		setSlToggle,
		handleSubmit,
	};
}
