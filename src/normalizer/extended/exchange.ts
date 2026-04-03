/**
 * Extended DexExchange implementation.
 *
 * Handles order placement, cancellation, modification, leverage,
 * and position TP/SL via Extended's REST API with Stark settlement signing.
 */

import type {
	DexExchange,
	PlaceOrderParams,
	OrderResult,
	CancelOrderParams,
	ModifyOrderParams,
	UpdateLeverageParams,
	SetPositionTpSlParams,
	WithdrawParams,
	WithdrawResult,
} from '../exchange';
import { EXTENDED_CONFIG } from './config';
import { getStoredAccount } from './utils/storage';
import type { StoredExtendedAccount } from './utils/storage';
import { l2ConfigMap, tradingConfigMap, assetPrecisionMap } from './extended';
import { fetchFees } from './services/fees-api';
import {
	buildOrderPayload,
	buildPositionTpSlPayload,
	truncateToTickSize,
	roundToSizeStep,
} from './utils/order-builder';
import { submitWithdrawal } from './services/withdrawal-api';

// ── Module State ──

let activeWalletAddress = '';

// ── Helpers ──

function getValidAccount(walletAddress: string): StoredExtendedAccount {
	const account = getStoredAccount(walletAddress);
	if (!account?.apiKey || !account.starkPrivateKey) {
		throw new Error('Not onboarded — please enable trading first');
	}
	return account;
}

function getL2Config(market: string) {
	const config = l2ConfigMap.get(market);
	if (!config) {
		throw new Error(`No L2 config found for market ${market}`);
	}
	return config;
}

function formatOrderParams(params: PlaceOrderParams): PlaceOrderParams {
	const config = tradingConfigMap.get(params.coin);
	if (!config) return params;

	const { minPriceChange, minOrderSizeChange } = config;
	return {
		...params,
		price: truncateToTickSize(params.price, minPriceChange),
		size: roundToSizeStep(params.size, minOrderSizeChange),
		tp: params.tp ? truncateToTickSize(params.tp, minPriceChange) : undefined,
		sl: params.sl ? truncateToTickSize(params.sl, minPriceChange) : undefined,
	};
}

function authHeaders(apiKey: string): Record<string, string> {
	return {
		'Content-Type': 'application/json',
		'X-Api-Key': apiKey,
	};
}

async function postOrder(
	body: unknown,
	apiKey: string,
): Promise<{ id: number; externalId: string }> {
	const response = await fetch(`${EXTENDED_CONFIG.REST_URL}/user/order`, {
		method: 'POST',
		headers: authHeaders(apiKey),
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		const message =
			(errorData as { error?: { message?: string } }).error?.message ??
			`Order failed: ${response.status}`;
		throw new Error(message);
	}

	const result = (await response.json()) as {
		status: string;
		data: { id: number; externalId: string };
	};
	return result.data;
}

async function deleteOrder(apiKey: string, externalId?: string): Promise<void> {
	const url = externalId
		? `${EXTENDED_CONFIG.REST_URL}/user/order?externalId=${encodeURIComponent(externalId)}`
		: `${EXTENDED_CONFIG.REST_URL}/user/order`;

	const response = await fetch(url, {
		method: 'DELETE',
		headers: authHeaders(apiKey),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		const message =
			(errorData as { error?: { message?: string } }).error?.message ??
			`Cancel failed: ${response.status}`;
		throw new Error(message);
	}
}

async function postMassCancel(body: unknown, apiKey: string): Promise<void> {
	const response = await fetch(
		`${EXTENDED_CONFIG.REST_URL}/user/order/massCancel`,
		{
			method: 'POST',
			headers: authHeaders(apiKey),
			body: JSON.stringify(body),
		},
	);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		const message =
			(errorData as { error?: { message?: string } }).error?.message ??
			`Mass cancel failed: ${response.status}`;
		throw new Error(message);
	}
}

async function patchLeverage(
	market: string,
	leverage: number,
	apiKey: string,
): Promise<void> {
	const response = await fetch(`${EXTENDED_CONFIG.REST_URL}/user/leverage`, {
		method: 'PATCH',
		headers: authHeaders(apiKey),
		body: JSON.stringify({ market, leverage }),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		const message =
			(errorData as { error?: { message?: string } }).error?.message ??
			`Leverage update failed: ${response.status}`;
		throw new Error(message);
	}
}

// ── Exchange Implementation ──

export const extendedExchange: DexExchange = {
	setWalletAddress(address: string) {
		activeWalletAddress = address.toLowerCase();
	},

	async placeOrder(params: PlaceOrderParams): Promise<OrderResult> {
		const account = getValidAccount(activeWalletAddress);
		const formatted = formatOrderParams(params);
		const l2Config = getL2Config(formatted.coin);
		const config = tradingConfigMap.get(formatted.coin);
		const fees = await fetchFees(activeWalletAddress, formatted.coin);

		const payload = await buildOrderPayload({
			orderParams: formatted,
			account,
			l2Config,
			takerFeeRate: fees.takerFeeRate,
			builderFeeRate: fees.builderFeeRate,
			minPriceChange: config?.minPriceChange ?? '0.01',
			minSizeChange: config?.minOrderSizeChange ?? '1',
			maxPositionValue: parseFloat(config?.maxPositionValue ?? '0'),
			quantityPrecision: assetPrecisionMap.get(formatted.coin) ?? 0,
		});

		const data = await postOrder(payload, account.apiKey);

		return {
			status: 'success',
			orderId: data.id,
			message: 'Order placed',
		};
	},

	async cancelOrder(params: CancelOrderParams): Promise<void> {
		const account = getValidAccount(activeWalletAddress);
		await deleteOrder(account.apiKey, params.externalId);
	},

	async cancelOrders(params: CancelOrderParams[]): Promise<void> {
		const account = getValidAccount(activeWalletAddress);
		const externalOrderIds = params
			.map((param) => param.externalId)
			.filter(Boolean) as string[];
		await postMassCancel({ externalOrderIds }, account.apiKey);
	},

	async modifyOrder(params: ModifyOrderParams): Promise<OrderResult> {
		const account = getValidAccount(activeWalletAddress);
		const config = tradingConfigMap.get(params.coin);
		const price = config
			? truncateToTickSize(params.price, config.minPriceChange)
			: params.price;
		const size = config
			? roundToSizeStep(params.size, config.minOrderSizeChange)
			: params.size;
		const l2Config = getL2Config(params.coin);
		const fees = await fetchFees(activeWalletAddress, params.coin);

		const payload = await buildOrderPayload({
			orderParams: {
				coin: params.coin,
				side: params.side,
				type: 'limit',
				price,
				size,
				reduceOnly: params.reduceOnly,
				tif: params.tif,
			},
			account,
			l2Config,
			takerFeeRate: fees.takerFeeRate,
			builderFeeRate: fees.builderFeeRate,
			minPriceChange: config?.minPriceChange ?? '0.01',
			minSizeChange: config?.minOrderSizeChange ?? '1',
			maxPositionValue: parseFloat(config?.maxPositionValue ?? '0'),
			quantityPrecision: assetPrecisionMap.get(params.coin) ?? 0,
		});

		payload.cancelId = String(params.orderId);

		const data = await postOrder(payload, account.apiKey);

		return {
			status: 'success',
			orderId: data.id,
			message: 'Order modified',
		};
	},

	async closePosition(params: {
		coin: string;
		size: number;
		side: 'buy' | 'sell';
	}): Promise<OrderResult> {
		return this.placeOrder({
			coin: params.coin,
			side: params.side,
			type: 'market',
			price: 0,
			size: params.size,
			reduceOnly: true,
			tif: 'Ioc',
		});
	},

	async updateLeverage(params: UpdateLeverageParams): Promise<void> {
		const account = getValidAccount(activeWalletAddress);
		await patchLeverage(params.coin, params.leverage, account.apiKey);
	},

	async updateMarginMode(_params: UpdateLeverageParams): Promise<void> {
		throw new Error('Margin mode changes are not supported on Extended');
	},

	async setPositionTpSl(params: SetPositionTpSlParams): Promise<void> {
		const account = getValidAccount(activeWalletAddress);
		const l2Config = getL2Config(params.coin);
		const config = tradingConfigMap.get(params.coin);
		const fees = await fetchFees(activeWalletAddress, params.coin);

		const side = params.side === 'LONG' ? 'sell' : 'buy';

		const payload = await buildPositionTpSlPayload({
			coin: params.coin,
			side,
			size: params.size,
			tp: params.tp,
			sl: params.sl,
			account,
			l2Config,
			takerFeeRate: fees.takerFeeRate,
			maxPositionValue: parseFloat(config?.maxPositionValue ?? '0'),
			quantityPrecision: assetPrecisionMap.get(params.coin) ?? 0,
			minPriceChange: config?.minPriceChange ?? '1',
		});

		await postOrder(payload, account.apiKey);
	},

	async withdraw(params: WithdrawParams): Promise<WithdrawResult> {
		try {
			await submitWithdrawal({
				walletAddress: activeWalletAddress,
				amount: params.amount,
				chainId: '1',
				quoteId: '',
			});
			return { status: 'success', message: 'Withdrawal submitted' };
		} catch (withdrawError) {
			const message =
				withdrawError instanceof Error
					? withdrawError.message
					: 'Withdrawal failed';
			return { status: 'error', message };
		}
	},
};
