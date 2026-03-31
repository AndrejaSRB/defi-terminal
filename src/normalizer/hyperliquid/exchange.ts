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
import {
	buildOrderAction,
	buildCancelAction,
	buildModifyAction,
	buildUpdateLeverageAction,
	buildPositionTpslAction,
	signAction,
	formatPriceForExchange,
	formatSizeForExchange,
} from '@/services/hyperliquid/order-builder';
import { executeWithdraw } from '@/services/hyperliquid/withdraw';
import { getStoredAgent } from './onboarding';

const HL_EXCHANGE_URL = 'https://api.hyperliquid.xyz/exchange';

async function postExchange(payload: unknown): Promise<unknown> {
	const res = await fetch(HL_EXCHANGE_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Exchange request failed: ${text}`);
	}

	const data = await res.json();
	if (data.status === 'err') {
		throw new Error(data.response || 'Exchange request rejected');
	}
	return data;
}

function getValidAgent(walletAddress: string) {
	const agent = getStoredAgent(walletAddress);
	if (!agent) throw new Error('No trading agent found. Please enable trading.');
	if (agent.validUntil <= Date.now() + 5 * 60 * 1000) {
		throw new Error('Trading agent expired. Please re-enable trading.');
	}
	return agent;
}

// walletAddress must be set before calling exchange methods
let activeWalletAddress = '';

export function setActiveWalletAddress(address: string) {
	activeWalletAddress = address.toLowerCase();
}

export const hyperliquidExchange: DexExchange = {
	setWalletAddress(address: string) {
		activeWalletAddress = address.toLowerCase();
	},

	async placeOrder(params: PlaceOrderParams): Promise<OrderResult> {
		const agent = getValidAgent(activeWalletAddress);
		const isMarket = params.type === 'market';
		const formattedParams = {
			...params,
			price: formatPriceForExchange(
				params.price,
				params.coin,
				params.side,
				isMarket,
				params.slippage ?? 8,
			),
			size: formatSizeForExchange(params.size, params.coin),
			tp: params.tp
				? formatPriceForExchange(params.tp, params.coin, params.side, false)
				: undefined,
			sl: params.sl
				? formatPriceForExchange(params.sl, params.coin, params.side, false)
				: undefined,
		};
		const action = buildOrderAction(formattedParams);
		const nonce = Date.now();
		const signed = await signAction(
			action as unknown as Record<string, unknown>,
			agent.privateKey as `0x${string}`,
			nonce,
		);

		const data = (await postExchange(signed)) as {
			response?: {
				type?: string;
				data?: {
					statuses?: { filled?: unknown; resting?: { oid?: number } }[];
				};
			};
		};

		const status = data.response?.data?.statuses?.[0];
		if (status?.filled || status?.resting) {
			return {
				status: 'success',
				orderId: status.resting?.oid,
				message: status.filled ? 'Order filled' : 'Order placed',
			};
		}

		return { status: 'success', message: 'Order submitted' };
	},

	async cancelOrder(params: CancelOrderParams): Promise<void> {
		const agent = getValidAgent(activeWalletAddress);
		const action = buildCancelAction([params]);
		const nonce = Date.now();
		const signed = await signAction(
			action as unknown as Record<string, unknown>,
			agent.privateKey as `0x${string}`,
			nonce,
		);
		await postExchange(signed);
	},

	async cancelOrders(params: CancelOrderParams[]): Promise<void> {
		const agent = getValidAgent(activeWalletAddress);
		const action = buildCancelAction(params);
		const nonce = Date.now();
		const signed = await signAction(
			action as unknown as Record<string, unknown>,
			agent.privateKey as `0x${string}`,
			nonce,
		);
		await postExchange(signed);
	},

	async modifyOrder(params: ModifyOrderParams): Promise<OrderResult> {
		const agent = getValidAgent(activeWalletAddress);
		const action = buildModifyAction({
			...params,
			price: formatPriceForExchange(params.price, params.coin, 'buy', false),
			size: formatSizeForExchange(params.size, params.coin),
		});
		const nonce = Date.now();
		const signed = await signAction(
			action as unknown as Record<string, unknown>,
			agent.privateKey as `0x${string}`,
			nonce,
		);
		await postExchange(signed);
		return { status: 'success', message: 'Order modified' };
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
		const agent = getValidAgent(activeWalletAddress);
		const action = buildUpdateLeverageAction(params);
		const nonce = Date.now();
		const signed = await signAction(
			action as unknown as Record<string, unknown>,
			agent.privateKey as `0x${string}`,
			nonce,
		);
		await postExchange(signed);
	},

	async updateMarginMode(params: UpdateLeverageParams): Promise<void> {
		return this.updateLeverage(params);
	},

	async setPositionTpSl(params: SetPositionTpSlParams): Promise<void> {
		const agent = getValidAgent(activeWalletAddress);
		const formattedParams = {
			...params,
			tp: params.tp
				? formatPriceForExchange(params.tp, params.coin, 'buy', false)
				: undefined,
			sl: params.sl
				? formatPriceForExchange(params.sl, params.coin, 'sell', false)
				: undefined,
		};
		const action = buildPositionTpslAction(formattedParams);
		const nonce = Date.now();
		const signed = await signAction(
			action as unknown as Record<string, unknown>,
			agent.privateKey as `0x${string}`,
			nonce,
		);
		await postExchange(signed);
	},

	async withdraw(params: WithdrawParams): Promise<WithdrawResult> {
		try {
			await executeWithdraw(
				{
					amount: params.amount.toString(),
					destination: params.destination,
				},
				params.sign,
			);
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
