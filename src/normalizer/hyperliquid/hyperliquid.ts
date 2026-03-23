import type { AggregationLevel, AssetMeta } from '@/normalizer/types';
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
import { getAggregationLevels } from './utils/aggregation';
import {
	parseActiveAsset,
	parseCandle,
	parseCandles,
	parseOrderBook,
	parsePrices,
	parseTrades,
	parseUserOpenOrders,
	parseUserPositions,
} from './utils/parser';

// ── HL-specific channel descriptor ──────────────────────────────────
type HLChannelDescriptor =
	| { type: 'allMids'; dex: string }
	| { type: 'l2Book'; coin: string; nSigFigs?: number; mantissa?: number }
	| { type: 'trades'; coin: string }
	| { type: 'activeAssetCtx'; coin: string }
	| { type: 'allDexsClearinghouseState'; user: string }
	| { type: 'openOrders'; user: string; dex: string }
	| { type: 'candle'; coin: string; interval: string };

const HL_INFO_URL = 'https://api.hyperliquid.xyz/info';

// Module-level caches — populated by init(), read by formatters.
const szDecimalsMap = new Map<string, number>();

// Tracks active L2 channel subscriptions for WS message routing.
// Key: coin ("BTC"), Value: full channel key ("l2Book:BTC:5:2")
const activeL2Channels = new Map<string, string>();

// Tracks the allMids channel key — server doesn't echo dex param back.
let activeAllMidsChannel = 'allMids';

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

	async init() {
		const res = await fetch(HL_INFO_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
		});
		const [meta] = (await res.json()) as [
			{
				universe: {
					name: string;
					szDecimals: number;
					maxLeverage: number;
					onlyIsolated: boolean;
				}[];
			},
		];

		const assetMetaMap = new Map<string, AssetMeta>();

		for (const asset of meta.universe) {
			szDecimalsMap.set(asset.name, asset.szDecimals);
			assetMetaMap.set(asset.name, {
				name: asset.name,
				szDecimals: asset.szDecimals,
				maxLeverage: asset.maxLeverage,
				onlyIsolated: asset.onlyIsolated,
			});
		}

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

	// Parsers
	parseOrderBook,
	parsePrices,
	parseTrades,
	parseActiveAsset,
	parseUserPositions,
	parseUserOpenOrders,
	parseCandles,
	parseCandle,

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
};
