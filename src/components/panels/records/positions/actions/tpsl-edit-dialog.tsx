import { memo, useState, useCallback, useEffect } from 'react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { activeDexExchangeAtom, activeNormalizerAtom } from '@/atoms/dex';
import { pricesAtom } from '@/atoms/prices';
import { walletAddressAtom } from '@/atoms/user/onboarding';

import { safeParseFloat } from '@/lib/numbers';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
	activePositionActionAtom,
	isClosingPositionAtom,
} from '../atoms/position-actions-atoms';

export const TpslEditDialog = memo(function TpslEditDialog() {
	const store = useStore();
	const queryClient = useQueryClient();
	const action = useAtomValue(activePositionActionAtom);
	const setAction = useSetAtom(activePositionActionAtom);
	const setIsClosing = useSetAtom(isClosingPositionAtom);
	const isClosing = useAtomValue(isClosingPositionAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);

	const open = action?.type === 'tpsl';
	const coin = action?.coin ?? '';
	const side = action?.side ?? 'LONG';
	const fullSize = action?.size ?? 0;
	const entryPrice = action?.entryPrice ?? 0;
	const prices = useAtomValue(pricesAtom);
	// Live mark price from allMids WS
	const markPrice = coin ? safeParseFloat(prices[coin]) : 0;
	const existingTpId = action?.tpOrderId ?? null;
	const existingSLId = action?.slOrderId ?? null;

	const [tpPrice, setTpPrice] = useState('');
	const [slPrice, setSlPrice] = useState('');
	const [tpGain, setTpGain] = useState('');
	const [slLoss, setSlLoss] = useState('');
	const [configureAmount, setConfigureAmount] = useState(false);
	const [limitPriceEnabled, setLimitPriceEnabled] = useState(false);
	const [tpLimitPrice, setTpLimitPrice] = useState('');
	const [slLimitPrice, setSlLimitPrice] = useState('');
	const [sizePercent, setSizePercent] = useState(100);
	// Track which TP/SL have been canceled locally
	const [canceledTp, setCanceledTp] = useState(false);
	const [canceledSl, setCanceledSl] = useState(false);

	useEffect(() => {
		if (open) {
			setTpPrice('');
			setSlPrice('');
			setTpGain('');
			setSlLoss('');
			setConfigureAmount(false);
			setLimitPriceEnabled(false);
			setTpLimitPrice('');
			setSlLimitPrice('');
			setSizePercent(100);
			setCanceledTp(false);
			setCanceledSl(false);
		}
	}, [open]);

	const leverage = safeParseFloat(action?.leverage);
	const size = (fullSize * sizePercent) / 100;
	const direction = side === 'LONG' ? 1 : -1;
	// Price decimals for this token (e.g., ETH = 1, BTC = 0)
	const priceDecimals =
		markPrice > 0 && coin
			? normalizer.calculatePriceDecimals(markPrice, coin)
			: 2;

	// TP/SL sync uses entry price (position's entry, not live mark)
	// For new orders (order form), mark price is used since no entry exists yet

	const handleTpPriceChange = useCallback(
		(value: string) => {
			setTpPrice(value);
			const tp = safeParseFloat(value);
			if (entryPrice > 0 && tp > 0 && leverage > 0) {
				const pct =
					((tp - entryPrice) / entryPrice) * 100 * leverage * direction;
				setTpGain(pct.toFixed(2));
			}
		},
		[entryPrice, leverage, direction],
	);

	const handleTpGainChange = useCallback(
		(value: string) => {
			setTpGain(value);
			const gain = safeParseFloat(value);
			if (entryPrice > 0 && gain !== 0 && leverage > 0) {
				const adjusted = side === 'LONG' ? gain : -gain;
				const tp = entryPrice * (1 + adjusted / (leverage * 100));
				if (tp > 0) setTpPrice(tp.toFixed(priceDecimals));
			}
		},
		[entryPrice, leverage, side, priceDecimals],
	);

	const handleSlPriceChange = useCallback(
		(value: string) => {
			setSlPrice(value);
			const sl = safeParseFloat(value);
			if (entryPrice > 0 && sl > 0 && leverage > 0) {
				const pct =
					((entryPrice - sl) / entryPrice) * 100 * leverage * direction;
				setSlLoss(pct.toFixed(2));
			}
		},
		[entryPrice, leverage, direction],
	);

	const handleSlLossChange = useCallback(
		(value: string) => {
			setSlLoss(value);
			const loss = safeParseFloat(value);
			if (entryPrice > 0 && loss !== 0 && leverage > 0) {
				const adjusted = side === 'LONG' ? -loss : loss;
				const sl = entryPrice * (1 + adjusted / (leverage * 100));
				if (sl > 0) setSlPrice(sl.toFixed(priceDecimals));
			}
		},
		[entryPrice, leverage, side, priceDecimals],
	);

	// Expected profit/loss in USDC
	const tpPriceNum = safeParseFloat(tpPrice);
	const slPriceNum = safeParseFloat(slPrice);
	const expectedProfit =
		tpPriceNum > 0 ? (tpPriceNum - entryPrice) * size * direction : 0;
	const expectedLoss =
		slPriceNum > 0 ? (slPriceNum - entryPrice) * size * direction : 0;

	const handleCancelTp = useCallback(async () => {
		if (!existingTpId || isClosing) return;
		const exchange = store.get(activeDexExchangeAtom);
		if (!exchange) {
			toast.error('Trading not available for this DEX');
			return;
		}
		setIsClosing(true);
		const address = store.get(walletAddressAtom) ?? '';
		exchange.setWalletAddress(address);
		try {
			await exchange.cancelOrder({ coin, orderId: existingTpId });
			setCanceledTp(true);
			toast.success('Take Profit canceled');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Cancel TP failed');
		} finally {
			setIsClosing(false);
		}
	}, [existingTpId, isClosing, coin, store, setIsClosing]);

	const handleCancelSl = useCallback(async () => {
		if (!existingSLId || isClosing) return;
		const exchange = store.get(activeDexExchangeAtom);
		if (!exchange) {
			toast.error('Trading not available for this DEX');
			return;
		}
		setIsClosing(true);
		const address = store.get(walletAddressAtom) ?? '';
		exchange.setWalletAddress(address);
		try {
			await exchange.cancelOrder({ coin, orderId: existingSLId });
			setCanceledSl(true);
			toast.success('Stop Loss canceled');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Cancel SL failed');
		} finally {
			setIsClosing(false);
		}
	}, [existingSLId, isClosing, coin, store, setIsClosing]);

	const handleConfirm = useCallback(async () => {
		if (isClosing) return;
		if (tpPriceNum <= 0 && slPriceNum <= 0) {
			toast.error('Set at least one: Take Profit or Stop Loss');
			return;
		}

		const exchange = store.get(activeDexExchangeAtom);
		if (!exchange) {
			toast.error('Trading not available for this DEX');
			return;
		}

		setIsClosing(true);
		const address = store.get(walletAddressAtom) ?? '';
		exchange.setWalletAddress(address);

		try {
			await exchange.setPositionTpSl({
				coin,
				side,
				size,
				tp: tpPriceNum > 0 ? tpPriceNum : undefined,
				sl: slPriceNum > 0 ? slPriceNum : undefined,
			});

			toast.success('TP/SL set for position');
			queryClient.invalidateQueries({ queryKey: ['dex-user-data'] });
			setAction(null);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Set TP/SL failed');
		} finally {
			setIsClosing(false);
		}
	}, [
		isClosing,
		tpPriceNum,
		slPriceNum,
		side,
		coin,
		size,
		store,
		setIsClosing,
		setAction,
	]);

	const showTpCancel = existingTpId && !canceledTp;
	const showSlCancel = existingSLId && !canceledSl;

	return (
		<Dialog open={open} onOpenChange={() => setAction(null)}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>TP/SL for Position</DialogTitle>
				</DialogHeader>

				{/* Position Info */}
				<div className="space-y-1 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Coin</span>
						<span className="text-foreground">{coin}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Position</span>
						<span className="text-primary">
							{normalizer.formatSize(fullSize, coin)} {coin}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Entry Price</span>
						<span className="text-foreground">
							{normalizer.formatPrice(entryPrice, coin)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Mark Price</span>
						<span className="text-foreground">
							{normalizer.formatPrice(markPrice, coin)}
						</span>
					</div>
				</div>

				<div className="mt-2 space-y-3">
					{/* TP Section */}
					{showTpCancel ? (
						<div className="space-y-0.5 text-xs">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Take Profit</span>
								<div className="flex items-center gap-2">
									<span className="text-foreground">
										Price above {action?.tpPrice ?? '--'}
									</span>
									<button
										type="button"
										disabled={isClosing}
										onClick={handleCancelTp}
										className="text-primary hover:text-primary/80 disabled:opacity-50"
									>
										Cancel
									</button>
								</div>
							</div>
							{expectedProfit !== 0 && (
								<div className="text-right text-muted-foreground">
									Expected profit: {expectedProfit.toFixed(2)} USDC
								</div>
							)}
						</div>
					) : (
						<div className="space-y-1">
							<div className="grid grid-cols-2 gap-1.5">
								<NumberInput
									value={tpPrice}
									onValueChange={handleTpPriceChange}
									placeholder="TP Price"
								/>
								<NumberInput
									value={tpGain}
									onValueChange={handleTpGainChange}
									placeholder="Gain"
									suffix="%"
								/>
							</div>
							{tpPriceNum > 0 && (
								<div className="text-right text-xs text-muted-foreground">
									Expected profit: {expectedProfit.toFixed(2)} USDC
								</div>
							)}
						</div>
					)}

					{/* SL Section */}
					{showSlCancel ? (
						<div className="space-y-0.5 text-xs">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Stop Loss</span>
								<div className="flex items-center gap-2">
									<span className="text-foreground">
										Price below {action?.slPrice ?? '--'}
									</span>
									<button
										type="button"
										disabled={isClosing}
										onClick={handleCancelSl}
										className="text-primary hover:text-primary/80 disabled:opacity-50"
									>
										Cancel
									</button>
								</div>
							</div>
							{expectedLoss !== 0 && (
								<div className="text-right text-muted-foreground">
									Expected loss: {expectedLoss.toFixed(2)} USDC
								</div>
							)}
						</div>
					) : (
						<div className="space-y-1">
							<div className="grid grid-cols-2 gap-1.5">
								<NumberInput
									value={slPrice}
									onValueChange={handleSlPriceChange}
									placeholder="SL Price"
								/>
								<NumberInput
									value={slLoss}
									onValueChange={handleSlLossChange}
									placeholder="Loss"
									suffix="%"
								/>
							</div>
							{slPriceNum > 0 && (
								<div className="text-right text-xs text-muted-foreground">
									Expected loss: {expectedLoss.toFixed(2)} USDC
								</div>
							)}
						</div>
					)}

					{/* Configure Amount */}
					<label className="flex cursor-pointer items-center gap-2 text-xs">
						<Checkbox
							checked={configureAmount}
							onCheckedChange={(checked) =>
								setConfigureAmount(checked === true)
							}
						/>
						<span className="text-foreground font-medium">
							Configure Amount
						</span>
					</label>
					{configureAmount && (
						<Slider
							min={0}
							max={100}
							step={1}
							value={[sizePercent]}
							onValueChange={(values) => setSizePercent(values[0])}
						/>
					)}

					{/* Limit Price */}
					<label className="flex cursor-pointer items-center gap-2 text-xs">
						<Checkbox
							checked={limitPriceEnabled}
							onCheckedChange={(checked) =>
								setLimitPriceEnabled(checked === true)
							}
						/>
						<span className="text-foreground font-medium">Limit Price</span>
					</label>
					{limitPriceEnabled && (
						<div className="grid grid-cols-2 gap-1.5">
							<NumberInput
								value={tpLimitPrice}
								onValueChange={setTpLimitPrice}
								placeholder="TP Limit Price"
							/>
							<NumberInput
								value={slLimitPrice}
								onValueChange={setSlLimitPrice}
								placeholder="SL Limit Price"
							/>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						className="w-full"
						disabled={isClosing}
						onClick={handleConfirm}
					>
						{isClosing ? 'Confirming...' : 'Confirm'}
					</Button>
				</DialogFooter>

				<div className="mt-2 space-y-2">
					<p className="text-[10px] leading-relaxed text-muted-foreground">
						By default take-profit and stop-loss orders apply to the entire
						position. Take-profit and stop-loss automatically cancel after
						closing the position. A market order is triggered when the stop loss
						or take profit price is reached.
					</p>
					<p className="text-[10px] leading-relaxed text-muted-foreground">
						If the order size is configured above, the TP/SL order will be for
						that size no matter how the position changes in the future.
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
});
