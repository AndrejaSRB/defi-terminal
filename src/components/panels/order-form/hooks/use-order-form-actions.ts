import { useCallback, useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { toast } from 'sonner';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeDexOnboardingAtom, activeDexExchangeAtom } from '@/atoms/dex';
import {
	onboardingBlockerAtom,
	onboardingVersionAtom,
	walletAddressAtom,
} from '@/atoms/user/onboarding';
import { useWalletSigner } from '@/hooks/use-wallet-signer';
import { tradingWs } from '@/services/ws';
import { setActiveWalletAddress } from '@/normalizer/hyperliquid/exchange';
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
	tpSourceAtom,
	slPriceAtom,
	slLossAtom,
	slToggleAtom,
	slSourceAtom,
	resetMarginOverridesAtom,
	isSubmittingAtom,
	slippageAtom,
} from '../atoms/order-form-atoms';
import {
	availableToTradeAtom,
	activePositionAtom,
	activeMetaAtom,
	markPriceAtom,
	effectivePriceAtom,
	orderValueAtom,
	maxSizeInCoinAtom,
	priceDecimalsAtom,
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
	const { sign } = useWalletSigner();

	const setSideRaw = useSetAtom(orderSideAtom);
	const setOrderTypeAtom = useSetAtom(orderTypeAtom);
	const setLimitPrice = useSetAtom(limitPriceAtom);
	const setSize = useSetAtom(sizeAtom);
	const setSizeDenom = useSetAtom(sizeDenomAtom);
	const setSliderPercentAtom = useSetAtom(sliderPercentAtom);
	const setReduceOnly = useSetAtom(reduceOnlyAtom);
	const setMarginMode = useSetAtom(marginModeAtom);
	const resetMarginOverrides = useSetAtom(resetMarginOverridesAtom);
	const setLeverage = useSetAtom(leverageAtom);
	const setTpslEnabled = useSetAtom(tpslEnabledAtom);
	const setTpPriceRaw = useSetAtom(tpPriceAtom);
	const setTpGainRaw = useSetAtom(tpGainAtom);
	const setTpToggle = useSetAtom(tpToggleAtom);
	const setTpSource = useSetAtom(tpSourceAtom);
	const setSlPriceRaw = useSetAtom(slPriceAtom);
	const setSlLossRaw = useSetAtom(slLossAtom);
	const setSlToggle = useSetAtom(slToggleAtom);
	const setSlSource = useSetAtom(slSourceAtom);

	const resetForm = useCallback(() => {
		setSize('');
		setLimitPrice('');
		setSliderPercentAtom(0);
		setReduceOnly(false);
		setTpslEnabled(false);
		setTpPriceRaw('');
		setTpGainRaw('');
		setTpSource('price');
		setSlPriceRaw('');
		setSlLossRaw('');
		setSlSource('price');
		// Clear leverage/mode overrides — falls back to server values for new token
		resetMarginOverrides();
	}, [
		setSize,
		setLimitPrice,
		setSliderPercentAtom,
		setReduceOnly,
		setTpslEnabled,
		setTpPriceRaw,
		setTpGainRaw,
		setTpSource,
		setSlPriceRaw,
		setSlLossRaw,
		setSlSource,
		resetMarginOverrides,
	]);

	// Reset form on token switch
	useEffect(() => {
		if (prevTokenRef.current !== token) {
			prevTokenRef.current = token;
			resetForm();
		}
	}, [token, resetForm]);

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
			const meta = store.get(activeMetaAtom);
			const szDec = meta?.szDecimals ?? 2;

			if (denom === 'coin') {
				setSize(coinSize > 0 ? coinSize.toFixed(szDec) : '');
			} else {
				const usdSize = coinSize * price;
				setSize(usdSize > 0 ? usdSize.toFixed(2) : '');
			}
		},
		[setSliderPercentAtom, setSize, store],
	);

	// ── Side change clears TP/SL ────────────────────────────────────
	const setSide = useCallback(
		(side: 'long' | 'short') => {
			setSideRaw(side);
			setTpPriceRaw('');
			setTpGainRaw('');
			setTpSource('price');
			setSlPriceRaw('');
			setSlLossRaw('');
			setSlSource('price');
		},
		[
			setSideRaw,
			setTpPriceRaw,
			setTpGainRaw,
			setTpSource,
			setSlPriceRaw,
			setSlLossRaw,
			setSlSource,
		],
	);

	// ── TP/SL ↔ Reduce Only mutual exclusion ────────────────────────
	const toggleTpsl = useCallback(() => {
		const next = !store.get(tpslEnabledAtom);
		setTpslEnabled(next);
		if (next) setReduceOnly(false);
	}, [setTpslEnabled, setReduceOnly, store]);

	const setReduceOnlyAction = useCallback(
		(checked: boolean) => {
			setReduceOnly(checked);
			if (checked) {
				setTpslEnabled(false);
				setTpPriceRaw('');
				setTpGainRaw('');
				setSlPriceRaw('');
				setSlLossRaw('');
			}
		},
		[
			setReduceOnly,
			setTpslEnabled,
			setTpPriceRaw,
			setTpGainRaw,
			setSlPriceRaw,
			setSlLossRaw,
		],
	);

	// ── TP/SL compound setters (leverage-aware) ─────────────────────
	// Formula: percent = ((targetPrice - entry) / entry) * 100 * leverage
	// Price from percent: targetPrice = entry * (1 + adjustedPercent / (leverage * 100))
	// adjustedPercent: +pct for TP long / SL short, -pct for TP short / SL long

	const setTpPrice = useCallback(
		(value: string) => {
			setTpPriceRaw(value);
			setTpSource('price');
			const entry = store.get(markPriceAtom);
			const leverage = store.get(leverageAtom);
			const side = store.get(orderSideAtom);
			const toggle = store.get(tpToggleAtom);
			const tp = safeParseFloat(value);
			if (entry <= 0 || tp <= 0) return;

			if (toggle === 'pct') {
				const rawPct = ((tp - entry) / entry) * 100 * leverage;
				const display = side === 'long' ? rawPct : -rawPct;
				setTpGainRaw(display.toFixed(2));
			} else {
				const usd = side === 'long' ? tp - entry : entry - tp;
				setTpGainRaw(usd.toFixed(2));
			}
		},
		[setTpPriceRaw, setTpGainRaw, store],
	);

	const setTpGain = useCallback(
		(value: string) => {
			setTpGainRaw(value);
			setTpSource('gain');
			const entry = store.get(markPriceAtom);
			const leverage = store.get(leverageAtom);
			const side = store.get(orderSideAtom);
			const toggle = store.get(tpToggleAtom);
			const decimals = store.get(priceDecimalsAtom);
			const gain = safeParseFloat(value);
			if (entry <= 0 || gain === 0) return;

			let tp: number;
			if (toggle === 'pct') {
				const adjusted = side === 'long' ? gain : -gain;
				tp = entry * (1 + adjusted / (leverage * 100));
			} else {
				tp = side === 'long' ? entry + gain : entry - gain;
			}
			if (tp > 0) setTpPriceRaw(tp.toFixed(decimals));
		},
		[setTpGainRaw, setTpPriceRaw, store],
	);

	const setSlPrice = useCallback(
		(value: string) => {
			setSlPriceRaw(value);
			setSlSource('price');
			const entry = store.get(markPriceAtom);
			const leverage = store.get(leverageAtom);
			const side = store.get(orderSideAtom);
			const toggle = store.get(slToggleAtom);
			const sl = safeParseFloat(value);
			if (entry <= 0 || sl <= 0) return;

			if (toggle === 'pct') {
				const rawPct = ((entry - sl) / entry) * 100 * leverage;
				const display = side === 'long' ? rawPct : -rawPct;
				setSlLossRaw(display.toFixed(2));
			} else {
				const usd = side === 'long' ? entry - sl : sl - entry;
				setSlLossRaw(usd.toFixed(2));
			}
		},
		[setSlPriceRaw, setSlLossRaw, store],
	);

	const setSlLoss = useCallback(
		(value: string) => {
			setSlLossRaw(value);
			setSlSource('loss');
			const entry = store.get(markPriceAtom);
			const leverage = store.get(leverageAtom);
			const side = store.get(orderSideAtom);
			const toggle = store.get(slToggleAtom);
			const decimals = store.get(priceDecimalsAtom);
			const loss = safeParseFloat(value);
			if (entry <= 0 || loss === 0) return;

			let sl: number;
			if (toggle === 'pct') {
				const adjusted = side === 'long' ? -loss : loss;
				sl = entry * (1 + adjusted / (leverage * 100));
			} else {
				sl = side === 'long' ? entry - loss : entry + loss;
			}
			if (sl > 0) setSlPriceRaw(sl.toFixed(decimals));
		},
		[setSlLossRaw, setSlPriceRaw, store],
	);

	const handleSubmit = useCallback(async () => {
		// Guard against double-click
		if (store.get(isSubmittingAtom)) return;

		// If an onboarding step is pending, execute it instead of validating
		const blocker = store.get(onboardingBlockerAtom);
		if (blocker) {
			store.set(isSubmittingAtom, true);
			const onboarding = store.get(activeDexOnboardingAtom);
			const address = store.get(walletAddressAtom) ?? '';
			try {
				await onboarding.executeStep({
					stepId: blocker.id,
					walletAddress: address,
					sign,
				});
				// Force onboarding atoms to recompute (localStorage changed)
				store.set(onboardingVersionAtom, (prev) => prev + 1);
			} catch (error) {
				const msg =
					error instanceof Error ? error.message : 'Onboarding step failed';
				toast.error(msg);
			} finally {
				store.set(isSubmittingAtom, false);
			}
			return;
		}

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
		// Round to szDecimals — prevents "Size precision exceeds N decimals"
		const szDec = meta?.szDecimals ?? 2;
		const szMultiplier = 10 ** szDec;
		sizeInCoin = Math.round(sizeInCoin * szMultiplier) / szMultiplier;

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
			toast.error(result.errors[0].message);
			return;
		}

		// Place order via DEX exchange adapter
		store.set(isSubmittingAtom, true);
		try {
			const address = store.get(walletAddressAtom) ?? '';
			setActiveWalletAddress(address);

			const exchange = store.get(activeDexExchangeAtom);
			const token = store.get(activeTokenAtom);
			const slippageVal = store.get(slippageAtom);

			const orderResult = await exchange.placeOrder(
				{
					coin: token,
					side: side === 'long' ? 'buy' : 'sell',
					type,
					price:
						type === 'market'
							? mark
							: safeParseFloat(store.get(limitPriceAtom)),
					size: sizeInCoin,
					reduceOnly,
					slippage: slippageVal,
					tif: type === 'market' ? 'Ioc' : 'Gtc',
					tp: tpslEnabled
						? safeParseFloat(store.get(tpPriceAtom)) || undefined
						: undefined,
					sl: tpslEnabled
						? safeParseFloat(store.get(slPriceAtom)) || undefined
						: undefined,
				},
				tradingWs,
			);

			if (orderResult.status === 'success') {
				toast.success(orderResult.message ?? 'Order placed');
			} else {
				toast.error(orderResult.message ?? 'Order failed');
			}
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : 'Order placement failed';
			toast.error(msg);
		} finally {
			store.set(isSubmittingAtom, false);
		}
	}, [store, sign]);

	return {
		setSide,
		setOrderType,
		setLimitPrice,
		setSize,
		setSizeDenom,
		setSliderPercent,
		setReduceOnly: setReduceOnlyAction,
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
