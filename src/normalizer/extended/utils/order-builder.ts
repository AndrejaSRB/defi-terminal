/**
 * Order payload builder for Extended DEX.
 *
 * Converts canonical PlaceOrderParams into Extended's REST API body.
 * All Stark amount computation is delegated to the Python signer service
 * for Decimal-precise results matching Extended's backend.
 */

import type { PlaceOrderParams } from '@/normalizer/exchange';
import type { ExtL2Config } from '../types/api';
import type { StoredExtendedAccount } from './storage';
import {
	signOrder,
	calcOrderExpiration,
	generateOrderNonce,
} from './order-hash';

// ── Types ──

interface SettlementResult {
	salt: number;
	settlement: {
		signature: { r: string; s: string };
		starkKey: string;
		collateralPosition: string;
	};
	expirationSeconds: number;
}

interface TpSlSubObject {
	triggerPrice: string;
	triggerPriceType: string;
	price: string;
	priceType: string;
	settlement: SettlementResult['settlement'];
}

export interface ExtendedOrderPayload {
	id: string;
	market: string;
	type: string;
	side: string;
	qty: string;
	price: string;
	timeInForce: string;
	expiryEpochMillis: number;
	fee: string;
	nonce: string;
	settlement?: SettlementResult['settlement'];
	reduceOnly: boolean;
	postOnly: boolean;
	selfTradeProtectionLevel?: string;
	cancelId?: string;
	trigger?: {
		triggerPrice: string;
		triggerPriceType: string;
		direction: string;
		executionPriceType: string;
	};
	tpSlType?: string;
	takeProfit?: TpSlSubObject;
	stopLoss?: TpSlSubObject;
	builderFee?: string;
	builderId?: number;
}

// ── Settlement ──

const SETTLEMENT_BUFFER_DAYS = 14;
const SECONDS_PER_DAY = 86_400;

export async function buildSettlement(params: {
	side: 'buy' | 'sell';
	price: string;
	qty: string;
	l2Config: ExtL2Config;
	account: StoredExtendedAccount;
	feeRate: string;
	salt?: number;
	/** Pre-computed order expiration to keep settlement and REST body in sync */
	orderExpiration?: number;
	/** For TP/SL: let the signer compute entire position size */
	maxPositionValue?: string;
	quantityPrecision?: number;
}): Promise<SettlementResult> {
	const { side, price, qty, l2Config, account, feeRate } = params;

	const orderExpiration = params.orderExpiration ?? calcOrderExpiration();
	const settlementExpiration =
		orderExpiration + SETTLEMENT_BUFFER_DAYS * SECONDS_PER_DAY;
	const salt = params.salt ?? generateOrderNonce();

	const result = await signOrder({
		side,
		qty,
		price,
		feeRate,
		syntheticId: l2Config.syntheticId,
		collateralId: l2Config.collateralId,
		syntheticResolution: l2Config.syntheticResolution,
		collateralResolution: l2Config.collateralResolution,
		positionId: account.l2Vault,
		expiration: settlementExpiration,
		salt,
		starkPublicKey: account.starkPublicKey,
		starkPrivateKey: account.starkPrivateKey,
		maxPositionValue: params.maxPositionValue,
		quantityPrecision: params.quantityPrecision,
	});

	return {
		salt,
		settlement: {
			signature: { r: `0x${result.r}`, s: `0x${result.s}` },
			starkKey: account.starkPublicKey,
			collateralPosition: String(account.l2Vault),
		},
		expirationSeconds: orderExpiration,
	};
}

// ── TP/SL Sub-Object ──

export async function buildTpSlSettlement(params: {
	triggerPrice: string;
	executionPrice: string;
	side: 'buy' | 'sell';
	qty: string;
	l2Config: ExtL2Config;
	account: StoredExtendedAccount;
	feeRate: string;
	isPositionTpSl?: boolean;
	salt?: number;
	orderExpiration?: number;
	maxPositionValue?: string;
	quantityPrecision?: number;
}): Promise<TpSlSubObject> {
	const { triggerPrice, executionPrice, side, isPositionTpSl, salt } = params;

	// For order-attached TP/SL: side is the entry side, flip to close side.
	// For position TP/SL: side is already the close side.
	const settlementSide = isPositionTpSl
		? side
		: side === 'buy'
			? 'sell'
			: 'buy';

	const { settlement } = await buildSettlement({
		...params,
		side: settlementSide,
		price: executionPrice,
		salt,
	});

	return {
		triggerPrice,
		triggerPriceType: 'LAST',
		price: executionPrice,
		priceType: isPositionTpSl ? 'MARKET' : 'LIMIT',
		settlement,
	};
}

// ── Full Order Payload ──

export async function buildOrderPayload(params: {
	orderParams: PlaceOrderParams;
	account: StoredExtendedAccount;
	l2Config: ExtL2Config;
	takerFeeRate: string;
	builderFeeRate: string;
	minPriceChange: string;
	minSizeChange: string;
	maxPositionValue: number;
	quantityPrecision: number;
}): Promise<ExtendedOrderPayload> {
	const {
		orderParams,
		account,
		l2Config,
		takerFeeRate,
		builderFeeRate,
		minPriceChange,
		minSizeChange,
		maxPositionValue,
		quantityPrecision,
	} = params;
	const isMarket = orderParams.type === 'market';

	// Market orders: Extended uses 0.75% slippage (bestAsk * 1.0075 / bestBid * 0.9925).
	const MARKET_SLIPPAGE = 0.75;
	const rawEffectivePrice = isMarket
		? orderParams.side === 'buy'
			? orderParams.price * (1 + MARKET_SLIPPAGE / 100)
			: orderParams.price * (1 - MARKET_SLIPPAGE / 100)
		: orderParams.price;
	const effectivePrice = truncateToTickSize(rawEffectivePrice, minPriceChange);

	// SDK reuses the same nonce for main + TP + SL settlements
	const nonce = generateOrderNonce();

	const qtyStr = toCleanString(orderParams.size, minSizeChange);
	const priceStr = toCleanString(effectivePrice, minPriceChange);

	// Build main settlement
	const mainSettlementPromise = buildSettlement({
		side: orderParams.side,
		price: priceStr,
		qty: qtyStr,
		l2Config,
		account,
		feeRate: takerFeeRate,
		salt: nonce,
	});

	// TP/SL close side is opposite of entry side
	const tpSlCloseSide: 'buy' | 'sell' =
		orderParams.side === 'buy' ? 'sell' : 'buy';

	// Execution price has 0.75% slippage from trigger, truncated to tick
	const execPrice = (trigger: number): string => {
		const raw = tpSlCloseSide === 'buy' ? trigger * 1.0075 : trigger * 0.9925;
		return toCleanString(
			truncateToTickSize(raw, minPriceChange),
			minPriceChange,
		);
	};

	// TP/SL qty computed by the signer with Decimal precision (maxPositionValue * 50 / price)
	const maxPosStr = String(maxPositionValue);

	// Round trigger prices first, then derive execution from rounded values.
	const tpTrigger = orderParams.tp
		? truncateToTickSize(orderParams.tp, minPriceChange)
		: undefined;
	const slTrigger = orderParams.sl
		? truncateToTickSize(orderParams.sl, minPriceChange)
		: undefined;
	const tpExecPrice = tpTrigger ? execPrice(tpTrigger) : undefined;
	const slExecPrice = slTrigger ? execPrice(slTrigger) : undefined;

	const tpPromise =
		tpTrigger && tpExecPrice
			? buildTpSlSettlement({
					triggerPrice: toCleanString(tpTrigger, minPriceChange),
					executionPrice: tpExecPrice,
					side: tpSlCloseSide,
					qty: '0',
					l2Config,
					account,
					feeRate: takerFeeRate,
					isPositionTpSl: true,
					salt: nonce,
					maxPositionValue: maxPosStr,
					quantityPrecision,
				})
			: undefined;

	const slPromise =
		slTrigger && slExecPrice
			? buildTpSlSettlement({
					triggerPrice: toCleanString(slTrigger, minPriceChange),
					executionPrice: slExecPrice,
					side: tpSlCloseSide,
					qty: '0',
					l2Config,
					account,
					feeRate: takerFeeRate,
					isPositionTpSl: true,
					salt: nonce,
					maxPositionValue: maxPosStr,
					quantityPrecision,
				})
			: undefined;

	const [mainResult, takeProfit, stopLoss] = await Promise.all([
		mainSettlementPromise,
		tpPromise,
		slPromise,
	]);

	const expiryEpochMillis = mainResult.expirationSeconds * 1000;

	const payload: ExtendedOrderPayload = {
		id: crypto.randomUUID(),
		market: orderParams.coin,
		type: isMarket ? 'MARKET' : 'LIMIT',
		side: orderParams.side.toUpperCase(),
		qty: qtyStr,
		price: priceStr,
		timeInForce: isMarket ? 'IOC' : mapTimeInForce(orderParams.tif),
		expiryEpochMillis,
		fee: takerFeeRate,
		nonce: String(mainResult.salt),
		settlement: mainResult.settlement,
		reduceOnly: orderParams.reduceOnly ?? false,
		postOnly: orderParams.tif === 'Alo',
		selfTradeProtectionLevel: 'ACCOUNT',
	};

	if (parseFloat(builderFeeRate) > 0) {
		payload.builderFee = builderFeeRate;
	}

	if (takeProfit || stopLoss) {
		payload.tpSlType = 'POSITION';
	}
	if (takeProfit) {
		payload.takeProfit = takeProfit;
	}
	if (stopLoss) {
		payload.stopLoss = stopLoss;
	}

	return payload;
}

// ── Position TP/SL Payload ──

export async function buildPositionTpSlPayload(params: {
	coin: string;
	side: 'buy' | 'sell';
	size: number;
	tp: number | undefined;
	sl: number | undefined;
	account: StoredExtendedAccount;
	l2Config: ExtL2Config;
	takerFeeRate: string;
	maxPositionValue: number;
	quantityPrecision: number;
	minPriceChange: string;
}): Promise<ExtendedOrderPayload> {
	const {
		coin,
		side,
		tp,
		sl,
		account,
		l2Config,
		takerFeeRate,
		maxPositionValue,
		quantityPrecision,
		minPriceChange,
	} = params;

	// Compute expiration ONCE — settlement signing and REST body must use the same value.
	const nonce = generateOrderNonce();
	const orderExpiration = calcOrderExpiration();

	// Execution price has 0.75% slippage from trigger, truncated to tick
	const execPrice = (trigger: number): string => {
		const raw = side === 'buy' ? trigger * 1.0075 : trigger * 0.9925;
		return toCleanString(
			truncateToTickSize(raw, minPriceChange),
			minPriceChange,
		);
	};

	const maxPosStr = String(maxPositionValue);

	// Round trigger prices FIRST, then derive execution prices from the rounded values.
	// Both must be consistent — server derives execution from the rounded trigger.
	const tpTrigger = tp ? truncateToTickSize(tp, minPriceChange) : undefined;
	const slTrigger = sl ? truncateToTickSize(sl, minPriceChange) : undefined;
	const tpExecPrice = tpTrigger ? execPrice(tpTrigger) : undefined;
	const slExecPrice = slTrigger ? execPrice(slTrigger) : undefined;

	// Same nonce and expiration for all settlements
	const tpPromise =
		tpTrigger && tpExecPrice
			? buildTpSlSettlement({
					triggerPrice: toCleanString(tpTrigger, minPriceChange),
					executionPrice: tpExecPrice,
					side,
					qty: '0',
					l2Config,
					account,
					feeRate: takerFeeRate,
					isPositionTpSl: true,
					salt: nonce,
					orderExpiration,
					maxPositionValue: maxPosStr,
					quantityPrecision,
				})
			: undefined;

	const slPromise =
		slTrigger && slExecPrice
			? buildTpSlSettlement({
					triggerPrice: toCleanString(slTrigger, minPriceChange),
					executionPrice: slExecPrice,
					side,
					qty: '0',
					l2Config,
					account,
					feeRate: takerFeeRate,
					isPositionTpSl: true,
					salt: nonce,
					orderExpiration,
					maxPositionValue: maxPosStr,
					quantityPrecision,
				})
			: undefined;

	const [takeProfit, stopLoss] = await Promise.all([tpPromise, slPromise]);

	// Position TP/SL: main envelope has qty=0, price=0, no settlement.
	const expiryEpochMillis = orderExpiration * 1000;

	return {
		id: crypto.randomUUID(),
		market: coin,
		type: 'TPSL',
		side: side.toUpperCase(),
		qty: '0',
		price: '0',
		timeInForce: 'GTT',
		expiryEpochMillis,
		fee: takerFeeRate,
		nonce: String(nonce),
		reduceOnly: true,
		postOnly: false,
		tpSlType: 'POSITION',
		takeProfit,
		stopLoss,
	};
}

// ── Helpers ──

function mapTimeInForce(tif?: 'Gtc' | 'Ioc' | 'Alo'): string {
	switch (tif) {
		case 'Ioc':
			return 'IOC';
		case 'Alo':
			return 'GTT';
		case 'Gtc':
		default:
			return 'GTT';
	}
}

// ── Exchange Formatting ──

/** Count decimal places in a step string like "0.00001" → 5 */
function stepDecimals(step: string): number {
	const dotIndex = step.indexOf('.');
	if (dotIndex === -1) return 0;
	return step.length - dotIndex - 1;
}

/**
 * Truncate a price to the market's minPriceChange precision.
 * E.g. minPriceChange="0.01" → 2 decimals, "0.00001" → 5 decimals.
 */
export function truncateToTickSize(
	value: number,
	minPriceChange: string,
): number {
	const tick = parseFloat(minPriceChange);
	if (!tick || !Number.isFinite(value)) return value;
	const decimals = stepDecimals(minPriceChange);
	const multiplier = 10 ** decimals;
	return Math.trunc(value * multiplier) / multiplier;
}

/**
 * Round a size to the market's minOrderSizeChange precision.
 */
export function roundToSizeStep(value: number, minSizeChange: string): number {
	const step = parseFloat(minSizeChange);
	if (!step || !Number.isFinite(value)) return value;
	const decimals = stepDecimals(minSizeChange);
	const multiplier = 10 ** decimals;
	return Math.round(value * multiplier) / multiplier;
}

/** Format a number to a clean string with exact decimal places (no float artifacts). */
export function toCleanString(value: number, stepStr: string): string {
	return value.toFixed(stepDecimals(stepStr));
}
