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
	orderValueAtom,
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
	const setTpPriceRaw = useSetAtom(tpPriceAtom);
	const setTpGainRaw = useSetAtom(tpGainAtom);
	const setTpToggle = useSetAtom(tpToggleAtom);
	const setSlPriceRaw = useSetAtom(slPriceAtom);
	const setSlLossRaw = useSetAtom(slLossAtom);
	const setSlToggle = useSetAtom(slToggleAtom);

	const resetForm = useCallback(() => {
		setSize('');
		setLimitPrice('');
		setSliderPercentAtom(0);
		setReduceOnly(false);
		setTpslEnabled(false);
		setTpPriceRaw('');
		setTpGainRaw('');
		setSlPriceRaw('');
		setSlLossRaw('');
	}, [
		setSize,
		setLimitPrice,
		setSliderPercentAtom,
		setReduceOnly,
		setTpslEnabled,
		setTpPriceRaw,
		setTpGainRaw,
		setSlPriceRaw,
		setSlLossRaw,
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

	// ── TP/SL compound setters ──────────────────────────────────────
	const computeGain = useCallback(
		(tpPrice: number, entryPrice: number): string => {
			if (entryPrice <= 0 || tpPrice <= 0) return '';
			const side = store.get(orderSideAtom);
			const toggle = store.get(tpToggleAtom);
			if (toggle === 'pct') {
				const pct =
					side === 'long'
						? ((tpPrice - entryPrice) / entryPrice) * 100
						: ((entryPrice - tpPrice) / entryPrice) * 100;
				return pct.toFixed(2);
			}
			const usd = side === 'long' ? tpPrice - entryPrice : entryPrice - tpPrice;
			return usd.toFixed(2);
		},
		[store],
	);

	const computeLoss = useCallback(
		(slPrice: number, entryPrice: number): string => {
			if (entryPrice <= 0 || slPrice <= 0) return '';
			const side = store.get(orderSideAtom);
			const toggle = store.get(slToggleAtom);
			if (toggle === 'pct') {
				const pct =
					side === 'long'
						? ((entryPrice - slPrice) / entryPrice) * 100
						: ((slPrice - entryPrice) / entryPrice) * 100;
				return pct.toFixed(2);
			}
			const usd = side === 'long' ? entryPrice - slPrice : slPrice - entryPrice;
			return usd.toFixed(2);
		},
		[store],
	);

	const setTpPrice = useCallback(
		(value: string) => {
			setTpPriceRaw(value);
			const entry = store.get(effectivePriceAtom);
			const tp = safeParseFloat(value);
			setTpGainRaw(computeGain(tp, entry));
		},
		[setTpPriceRaw, setTpGainRaw, computeGain, store],
	);

	const setTpGain = useCallback(
		(value: string) => {
			setTpGainRaw(value);
			const entry = store.get(effectivePriceAtom);
			const gain = safeParseFloat(value);
			if (entry <= 0 || gain === 0) return;
			const side = store.get(orderSideAtom);
			const toggle = store.get(tpToggleAtom);
			let tp: number;
			if (toggle === 'pct') {
				tp =
					side === 'long' ? entry * (1 + gain / 100) : entry * (1 - gain / 100);
			} else {
				tp = side === 'long' ? entry + gain : entry - gain;
			}
			if (tp > 0) setTpPriceRaw(tp.toFixed(2));
		},
		[setTpGainRaw, setTpPriceRaw, store],
	);

	const setSlPrice = useCallback(
		(value: string) => {
			setSlPriceRaw(value);
			const entry = store.get(effectivePriceAtom);
			const sl = safeParseFloat(value);
			setSlLossRaw(computeLoss(sl, entry));
		},
		[setSlPriceRaw, setSlLossRaw, computeLoss, store],
	);

	const setSlLoss = useCallback(
		(value: string) => {
			setSlLossRaw(value);
			const entry = store.get(effectivePriceAtom);
			const loss = safeParseFloat(value);
			if (entry <= 0 || loss === 0) return;
			const side = store.get(orderSideAtom);
			const toggle = store.get(slToggleAtom);
			let sl: number;
			if (toggle === 'pct') {
				sl =
					side === 'long' ? entry * (1 - loss / 100) : entry * (1 + loss / 100);
			} else {
				sl = side === 'long' ? entry - loss : entry + loss;
			}
			if (sl > 0) setSlPriceRaw(sl.toFixed(2));
		},
		[setSlLossRaw, setSlPriceRaw, store],
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
			orderValue: store.get(orderValueAtom),
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
