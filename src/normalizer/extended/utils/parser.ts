import type {
	ActiveAssetData,
	Candle,
	OrderBook,
	Trade,
} from '@/normalizer/types';
import type {
	ExtWsTrade,
	ExtWsCandle,
	ExtWsMarkPrice,
	ExtMarket,
	ExtCandle,
	ExtOrderBookLevel,
	ExtRestTrade,
} from '../types/api';

// ── Envelope Unwrap ──
// Extended WS messages arrive as { type?, data, ts, seq }.
// Multi-stream delivers the full envelope — unwrap to get inner data.

function unwrap(raw: unknown): unknown {
	const msg = raw as Record<string, unknown>;
	return msg.data ?? raw;
}

// ── Orderbook ──
// WS shape: { type: "SNAPSHOT"|"DELTA", data: { t, m, b: [{q,p}], a: [{q,p}] } }

interface WsOrderBookLevel {
	q: string;
	p: string;
	c?: string;
}

interface WsOrderBookData {
	t: string;
	m: string;
	b: WsOrderBookLevel[];
	a: WsOrderBookLevel[];
}

function parseWsBookLevels(
	levels: WsOrderBookLevel[],
): { price: number; size: number }[] {
	return levels.map((level) => ({
		price: parseFloat(level.p),
		size: parseFloat(level.q),
	}));
}

export function parseOrderBook(raw: unknown): OrderBook {
	const data = unwrap(raw) as WsOrderBookData;
	return {
		bids: parseWsBookLevels(data.b ?? []),
		asks: parseWsBookLevels(data.a ?? []),
		timestamp: Date.now(),
	};
}

export function parseRestOrderBook(data: {
	bid: ExtOrderBookLevel[];
	ask: ExtOrderBookLevel[];
}): OrderBook {
	return {
		bids: data.bid.map((level) => ({
			price: parseFloat(level.price),
			size: parseFloat(level.qty),
		})),
		asks: data.ask.map((level) => ({
			price: parseFloat(level.price),
			size: parseFloat(level.qty),
		})),
		timestamp: Date.now(),
	};
}

// ── Trades ──
// WS shape: { data: [{ i, m, S, tT, T, p, q }], ts, seq }

export function parseTrades(raw: unknown): Trade[] {
	const data = unwrap(raw);
	const trades = data as ExtWsTrade[];
	return Array.isArray(trades)
		? trades.map(parseSingleTrade)
		: [parseSingleTrade(trades)];
}

function parseSingleTrade(trade: ExtWsTrade): Trade {
	return {
		id: String(trade.i),
		coin: trade.m,
		side: trade.S === 'BUY' ? 'buy' : 'sell',
		price: parseFloat(trade.p),
		size: parseFloat(trade.q),
		timestamp: trade.T,
	};
}

export function parseRestTrades(data: ExtRestTrade[]): Trade[] {
	return data.map((trade) => ({
		id: String(trade.i),
		coin: trade.m,
		side: trade.S === 'BUY' ? 'buy' : 'sell',
		price: parseFloat(trade.p),
		size: parseFloat(trade.q),
		timestamp: Number(trade.T),
	}));
}

// ── Candles ──
// WS shape: { data: [{ o, l, h, c, v, T }], ts, seq }

export function parseCandles(raw: unknown): Candle[] {
	const data = raw as ExtCandle[];
	// Extended API returns candles in descending order — reverse for TradingView
	return data.map(parseSingleCandle).reverse();
}

export function parseCandle(raw: unknown): Candle {
	const data = unwrap(raw);
	const arr = Array.isArray(data) ? data : [data];
	const candle = arr[0] as ExtWsCandle;

	// Guard against non-candle messages (e.g. mark prices on same stream)
	if (!candle || candle.o === undefined) {
		return { time: 0, open: 0, high: 0, low: 0, close: 0, volume: 0 };
	}

	return parseSingleCandle(candle);
}

function parseSingleCandle(candle: ExtCandle | ExtWsCandle): Candle {
	return {
		time: Number(candle.T),
		open: parseFloat(candle.o),
		high: parseFloat(candle.h),
		low: parseFloat(candle.l),
		close: parseFloat(candle.c),
		volume: parseFloat(candle.v),
	};
}

// ── Mark Prices ──
// WS shape: { type: "MP", data: { m, p, ts }, ts, seq }

export function parseMarkPrice(raw: unknown): { coin: string; price: string } {
	const data = unwrap(raw) as ExtWsMarkPrice;
	return { coin: data.m, price: data.p };
}

export function marketToActiveAsset(market: ExtMarket): ActiveAssetData {
	const stats = market.marketStats;
	const markPrice = parseFloat(stats.markPrice);
	const oiBase = parseFloat(stats.openInterestBase);
	const openInterestUsd = oiBase * markPrice;

	return {
		coin: market.name,
		markPrice: stats.markPrice,
		oraclePrice: stats.indexPrice,
		prevDayPx: String(
			markPrice / (1 + parseFloat(stats.dailyPriceChangePercentage) / 100),
		),
		volume24h: stats.dailyVolume,
		openInterest: String(openInterestUsd),
		fundingRate: stats.fundingRate,
		fundingInterval: '1h',
	};
}
