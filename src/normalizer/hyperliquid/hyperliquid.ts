import type {
	ActiveAssetData,
	AggregationLevel,
	AssetMeta,
} from '@/normalizer/types';
import type {
	ChannelDescriptor,
	DexNormalizer,
	FormatPriceOptions,
} from '@/normalizer/normalizer';
import {
	calculatePriceDecimals,
	formatPrice as hlFormatPrice,
	formatSize as hlFormatSize,
} from './utils/format';
import type {
	HlAllPerpMetasResponse,
	HlMetaAndAssetCtxsResponse,
	HlWsAllDexsAssetCtxs,
} from './types';
import { getAggregationLevels } from './utils/aggregation';
import {
	parseActiveAsset,
	parseCandle,
	parseCandles,
	parseHistoricalOrders,
	parseOrderBook,
	parsePrices,
	parseTrades,
	parseUserOpenOrders,
	parseUserPositions,
	parseUserFills,
	parseUserBalances,
	parseSpotBalances,
	parseUserFundings,
	parseUserTradingContext,
} from './utils/parser';
import { setUniverseOrder } from '@/services/hyperliquid/order-builder';

// ── HL-specific channel descriptor ──────────────────────────────────
type HLChannelDescriptor =
	| { type: 'allMids'; dex: string }
	| { type: 'l2Book'; coin: string; nSigFigs?: number; mantissa?: number }
	| { type: 'trades'; coin: string }
	| { type: 'activeAssetCtx'; coin: string }
	| { type: 'allDexsClearinghouseState'; user: string }
	| { type: 'openOrders'; user: string; dex: string }
	| { type: 'candle'; coin: string; interval: string }
	| { type: 'allDexsAssetCtxs' }
	| { type: 'userFills'; user: string }
	| { type: 'spotState'; user: string }
	| { type: 'userFundings'; user: string }
	| { type: 'userHistoricalOrders'; user: string }
	| { type: 'activeAssetData'; user: string; coin: string };

const HL_INFO_URL = 'https://api.hyperliquid.xyz/info';

// Module-level caches — populated by init(), read by formatters.
const szDecimalsMap = new Map<string, number>();

export function getSzDecimals(coin: string): number {
	return szDecimalsMap.get(coin) ?? 2;
}

// Tracks active L2 channel subscriptions for WS message routing.
// Key: coin ("BTC"), Value: full channel key ("l2Book:BTC:5:2")
const activeL2Channels = new Map<string, string>();

// Tracks the allMids channel key — server doesn't echo dex param back.
let activeAllMidsChannel = 'allMids';

// Ordered universe per DEX group — needed to map WS array indices to coin names.
// Populated during init(). Includes delisted tokens for index alignment.
const universeOrder: string[][] = [];

// ── Channel Key ─────────────────────────────────────────────────────

function hlChannelKey(desc: ChannelDescriptor): string {
	const d = desc as HLChannelDescriptor;
	switch (d.type) {
		case 'allMids':
			return `allMids:${d.dex}`;
		case 'l2Book': {
			let key = `l2Book:${d.coin}`;
			if (d.nSigFigs != null) key += `:${d.nSigFigs}`;
			if (d.mantissa != null) key += `:${d.mantissa}`;
			return key;
		}
		case 'trades':
			return `trades:${d.coin}`;
		case 'activeAssetCtx':
			return `activeAssetCtx:${d.coin}`;
		case 'allDexsClearinghouseState':
			return `allDexsClearinghouseState:${d.user}`;
		case 'openOrders':
			return `openOrders:${d.user}:${d.dex}`;
		case 'candle':
			return `candle:${d.coin}:${d.interval}`;
		case 'allDexsAssetCtxs':
			return 'allDexsAssetCtxs';
		case 'userFills':
			return `userFills:${d.user}`;
		case 'spotState':
			return `spotState:${d.user}`;
		case 'userFundings':
			return `userFundings:${d.user}`;
		case 'userHistoricalOrders':
			return `userHistoricalOrders:${d.user}`;
		case 'activeAssetData':
			return `activeAssetData:${d.user}:${d.coin}`;
		default:
			return desc.type;
	}
}

// ── WS Message Routing ──────────────────────────────────────────────

function parseWsL2Book(
	data: unknown,
): { channel: string; payload: unknown } | null {
	const obj = data as Record<string, unknown>;
	const coin = obj.coin as string | undefined;
	if (!coin) return null;

	const channel = activeL2Channels.get(coin) ?? `l2Book:${coin}`;
	return { channel, payload: obj };
}

function parseWsTrade(
	data: unknown,
): { channel: string; payload: unknown } | null {
	if (!Array.isArray(data) || data.length === 0) return null;

	const coin = (data[0] as Record<string, unknown>).coin as string | undefined;
	if (!coin) return null;

	return { channel: `trades:${coin}`, payload: data };
}

function parseWsUserPositions(
	data: unknown,
): { channel: string; payload: unknown } | null {
	const obj = data as Record<string, unknown>;
	const user = obj.user as string | undefined;
	if (!user) return null;

	return {
		channel: `allDexsClearinghouseState:${user.toLowerCase()}`,
		payload: obj,
	};
}

function parseWsOpenOrders(
	data: unknown,
): { channel: string; payload: unknown } | null {
	const obj = data as Record<string, unknown>;
	const user = obj.user as string | undefined;
	const dex = obj.dex as string | undefined;
	if (!user) return null;

	const channel = dex
		? `openOrders:${user.toLowerCase()}:${dex}`
		: `openOrders:${user.toLowerCase()}`;
	return { channel, payload: obj };
}

function parseWsCandle(
	data: unknown,
): { channel: string; payload: unknown } | null {
	const obj = data as Record<string, unknown>;
	const coin = obj.s as string | undefined;
	const interval = obj.i as string | undefined;
	if (!coin) return null;

	return { channel: `candle:${coin}:${interval}`, payload: obj };
}

// ── Normalizer ──────────────────────────────────────────────────────

export const hyperliquidNormalizer: DexNormalizer = {
	name: 'HyperLiquid',
	wsUrl: 'wss://api.hyperliquid.xyz/ws',
	depositConfig: {
		chainId: 42161,
		tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
		tokenSymbol: 'USDC',
		tokenDecimals: 6,
		minDeposit: 5,
		fee: 0.2,
		bridgeAddress: '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7',
		estimatedTime: '~30 sec',
	},

	deserialize: (data: unknown) =>
		typeof data === 'string' ? JSON.parse(data) : data,
	formatPing: () => ({ method: 'ping' }),
	isPong: (message: unknown) =>
		typeof message === 'object' &&
		message !== null &&
		(message as { channel?: string }).channel === 'pong',

	async init() {
		const res = await fetch(HL_INFO_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ type: 'allPerpMetas' }),
		});
		const groups = (await res.json()) as HlAllPerpMetasResponse;

		const assetMetaMap = new Map<string, AssetMeta>();
		szDecimalsMap.clear();
		universeOrder.length = 0;

		for (const group of groups) {
			const coins: string[] = [];
			for (const asset of group.universe) {
				coins.push(asset.name);
				if (asset.isDelisted) continue;

				szDecimalsMap.set(asset.name, asset.szDecimals);
				assetMetaMap.set(asset.name, {
					name: asset.name,
					szDecimals: asset.szDecimals,
					maxLeverage: asset.maxLeverage,
					onlyIsolated: asset.onlyIsolated ?? false,
				});
			}
			universeOrder.push(coins);
		}

		// Share universe order with order builder for asset index lookups
		setUniverseOrder(universeOrder);

		return assetMetaMap;
	},

	getAggregationLevels: (midPrice) => getAggregationLevels(midPrice),

	channels: {
		prices: () => ({ type: 'allMids', dex: 'ALL_DEXS' }),
		orderBook: (coin: string, agg?: AggregationLevel) => {
			const desc: HLChannelDescriptor = { type: 'l2Book', coin };
			if (agg && agg.nSigFigs !== null) {
				desc.nSigFigs = agg.nSigFigs;
				if (agg.mantissa !== null) desc.mantissa = agg.mantissa;
			}
			return desc;
		},
		trades: (coin: string) => ({ type: 'trades', coin }),
		activeAsset: (coin: string) => ({ type: 'activeAssetCtx', coin }),
		candles: (coin: string, interval: string) => ({
			type: 'candle',
			coin,
			interval,
		}),
		userPositions: (address: string) => ({
			type: 'allDexsClearinghouseState',
			user: address.toLowerCase(),
		}),
		userOpenOrders: (address: string) => ({
			type: 'openOrders',
			user: address.toLowerCase(),
			dex: 'ALL_DEXS',
		}),
		allAssetCtxs: () => ({ type: 'allDexsAssetCtxs' }),
		userFills: (address: string) => ({
			type: 'userFills',
			user: address.toLowerCase(),
			aggregateByTime: true,
		}),
		userBalances: (address: string) => ({
			type: 'allDexsClearinghouseState',
			user: address.toLowerCase(),
		}),
		spotState: (address: string) => ({
			type: 'spotState',
			user: address.toLowerCase(),
		}),
		userFundings: (address: string) => ({
			type: 'userFundings',
			user: address.toLowerCase(),
		}),
		userHistoricalOrders: (address: string) => ({
			type: 'userHistoricalOrders',
			user: address.toLowerCase(),
		}),
		userTradingContext: (address: string, coin: string) => ({
			type: 'activeAssetData',
			user: address.toLowerCase(),
			coin,
		}),
	},

	// Protocol
	channelKey: hlChannelKey,

	formatSubscribe: (desc: ChannelDescriptor) => {
		const d = desc as HLChannelDescriptor;
		if (d.type === 'l2Book') {
			activeL2Channels.set(d.coin, hlChannelKey(desc));
		}
		if (d.type === 'allMids') {
			activeAllMidsChannel = hlChannelKey(desc);
		}
		return { method: 'subscribe', subscription: { ...desc } };
	},

	formatUnsubscribe: (desc: ChannelDescriptor) => {
		const d = desc as HLChannelDescriptor;
		if (d.type === 'l2Book') {
			activeL2Channels.delete(d.coin);
		}
		if (d.type === 'allMids') {
			activeAllMidsChannel = 'allMids';
		}
		return { method: 'unsubscribe', subscription: { ...desc } };
	},

	parseWsMessage: (raw: unknown) => {
		const msg = raw as Record<string, unknown>;
		if (!msg.channel || !msg.data) return null;

		const type = msg.channel as string;

		if (type === 'l2Book') return parseWsL2Book(msg.data);
		if (type === 'trades') return parseWsTrade(msg.data);
		if (type === 'allMids')
			return { channel: activeAllMidsChannel, payload: msg.data };
		if (type === 'allDexsClearinghouseState')
			return parseWsUserPositions(msg.data);
		if (type === 'openOrders') return parseWsOpenOrders(msg.data);
		if (type === 'candle') return parseWsCandle(msg.data);
		if (type === 'allDexsAssetCtxs')
			return { channel: 'allDexsAssetCtxs', payload: msg.data };
		if (type === 'userFundings') {
			const obj = msg.data as { user?: string };
			const user = obj.user?.toLowerCase() ?? 'unknown';
			return { channel: `userFundings:${user}`, payload: msg.data };
		}
		if (type === 'spotState') {
			const obj = msg.data as { user?: string };
			const user = obj.user?.toLowerCase() ?? 'unknown';
			return { channel: `spotState:${user}`, payload: msg.data };
		}
		if (type === 'userFills') {
			const obj = msg.data as { user?: string };
			const user = obj.user?.toLowerCase() ?? 'unknown';
			return { channel: `userFills:${user}`, payload: msg.data };
		}
		if (type === 'userHistoricalOrders') {
			const obj = msg.data as { user?: string };
			const user = obj.user?.toLowerCase() ?? 'unknown';
			return {
				channel: `userHistoricalOrders:${user}`,
				payload: msg.data,
			};
		}

		if (type === 'activeAssetData') {
			const obj = msg.data as { user?: string; coin?: string };
			const user = obj.user?.toLowerCase() ?? 'unknown';
			const coin = obj.coin ?? 'unknown';
			return {
				channel: `activeAssetData:${user}:${coin}`,
				payload: msg.data,
			};
		}

		// Default: per-coin channels (activeAssetCtx, etc.)
		const data = msg.data as Record<string, unknown>;
		const coin = data.coin as string | undefined;
		return { channel: coin ? `${type}:${coin}` : type, payload: data };
	},

	// Formatting
	formatPrice: (value: number, coin: string, options?: FormatPriceOptions) => {
		const szDecimals = szDecimalsMap.get(coin) ?? 2;
		const formatted = hlFormatPrice(value, szDecimals);
		const hasDollarSign = options?.hasDollarSign ?? true;
		return hasDollarSign ? `$${formatted}` : formatted;
	},

	formatSize: (value: number, coin: string) => {
		const szDecimals = szDecimalsMap.get(coin) ?? 2;
		return hlFormatSize(value, szDecimals);
	},

	calculatePriceDecimals: (value: number, coin: string) => {
		const szDecimals = szDecimalsMap.get(coin) ?? 2;
		return calculatePriceDecimals(value, szDecimals);
	},

	// Estimations
	estimateLiquidationPrice: ({ side, entryPrice, leverage }) => {
		// Simplified estimate using tier 0 maintenance margin rate (0.5%).
		// Real liq price depends on account equity, other positions, and tiered MM rates.
		// Accurate enough for pre-trade display; server computes exact value post-fill.
		const mmRate = 0.005;
		if (side === 'long') {
			return entryPrice * (1 - 1 / leverage + mmRate);
		}
		return entryPrice * (1 + 1 / leverage - mmRate);
	},

	// Parsers
	parseOrderBook,
	parsePrices,
	parseTrades,
	parseActiveAsset,
	parseUserPositions,
	parseUserOpenOrders,
	parseCandles,
	parseCandle,
	parseUserFills,
	parseUserBalances,
	parseSpotBalances,
	parseUserFundings,
	parseHistoricalOrders,
	parseUserTradingContext,

	// REST
	fetchOrderBook: async (coin: string, agg?: AggregationLevel) => {
		const body: Record<string, unknown> = { type: 'l2Book', coin };
		if (agg && agg.nSigFigs !== null) {
			body.nSigFigs = agg.nSigFigs;
			if (agg.mantissa !== null) body.mantissa = agg.mantissa;
		}
		const res = await fetch(HL_INFO_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		return parseOrderBook(await res.json());
	},

	fetchTrades: async (coin: string) => {
		const res = await fetch(HL_INFO_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ type: 'recentTrades', coin }),
		});
		return parseTrades(await res.json());
	},

	fetchCandles: async (
		coin: string,
		interval: string,
		startTime?: number,
		endTime?: number,
	) => {
		const now = Date.now();
		const res = await fetch(HL_INFO_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				type: 'candleSnapshot',
				req: {
					coin,
					interval,
					startTime: startTime ?? now,
					endTime: endTime ?? now,
				},
			}),
		});
		return parseCandles(await res.json());
	},

	fetchAllAssetCtxs: async () => {
		const res = await fetch(HL_INFO_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
		});
		const [meta, assetCtxs] = (await res.json()) as HlMetaAndAssetCtxsResponse;

		const result = new Map<string, ActiveAssetData>();

		for (let i = 0; i < meta.universe.length; i++) {
			const asset = meta.universe[i];
			const ctx = assetCtxs[i];
			if (asset.isDelisted || !ctx?.markPx) continue;

			result.set(asset.name, {
				coin: asset.name,
				markPrice: ctx.markPx,
				oraclePrice: ctx.oraclePx,
				prevDayPx: ctx.prevDayPx,
				volume24h: ctx.dayNtlVlm,
				openInterest: ctx.openInterest,
				fundingRate: ctx.funding,
				fundingInterval: '8h',
			});
		}

		return result;
	},

	parseAllAssetCtxs: (raw: unknown) => {
		const data = raw as HlWsAllDexsAssetCtxs;
		const result = new Map<string, ActiveAssetData>();

		for (let gi = 0; gi < data.ctxs.length; gi++) {
			const [, ctxs] = data.ctxs[gi];
			const coins = universeOrder[gi];
			if (!coins || !ctxs) continue;

			for (let i = 0; i < ctxs.length; i++) {
				const coin = coins[i];
				const ctx = ctxs[i];
				if (!coin || !ctx) continue;

				result.set(coin, {
					coin,
					markPrice: String(ctx.markPx),
					oraclePrice: String(ctx.oraclePx),
					prevDayPx: String(ctx.prevDayPx),
					volume24h: String(ctx.dayNtlVlm),
					openInterest: String(ctx.openInterest),
					fundingRate: String(ctx.funding),
					fundingInterval: '8h',
				});
			}
		}

		return result;
	},

	fetchUserFills: async (address: string, limit = 200) => {
		const res = await fetch(HL_INFO_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				type: 'userFills',
				user: address,
				aggregateByTime: true,
			}),
		});
		const all = parseUserFills(await res.json());
		return all.slice(0, limit);
	},
};
