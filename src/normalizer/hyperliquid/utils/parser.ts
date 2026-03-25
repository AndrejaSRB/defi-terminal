import type {
	ActiveAssetData,
	Candle,
	HistoricalOrder,
	OpenOrder,
	OrderBook,
	OrderType,
	Position,
	Prices,
	Trade,
	UserBalance,
	UserFill,
	FundingPayment,
	MarginSummary,
	UserTradingContext,
} from '@/normalizer/types';
import type {
	ActiveAssetCtx,
	AllMidsResponse,
	AllDexsClearinghouseState,
	HlCandle,
	HlHistoricalOrder,
	HlUserFill,
	HlFundingPayment,
	HlActiveAssetData,
	HlSpotBalance,
	HlOpenOrdersResponse,
	HlTrade,
	L2BookEvent,
} from '../types';

export function parseOrderBook(raw: unknown): OrderBook {
	const data = raw as L2BookEvent;
	return {
		bids: data.levels[0].map((l) => ({
			price: parseFloat(l.px),
			size: parseFloat(l.sz),
		})),
		asks: data.levels[1].map((l) => ({
			price: parseFloat(l.px),
			size: parseFloat(l.sz),
		})),
		timestamp: data.time,
	};
}

export function parsePrices(raw: unknown): Prices {
	const data = raw as Record<string, unknown>;
	const mids = (data.mids ?? data) as AllMidsResponse;
	return mids;
}

export function parseTrades(raw: unknown): Trade[] {
	const data = raw as HlTrade[];
	return data.map((t) => ({
		id: t.tid.toString(),
		coin: t.coin,
		side: t.side === 'B' ? 'buy' : 'sell',
		price: parseFloat(t.px),
		size: parseFloat(t.sz),
		timestamp: t.time,
	}));
}

export function parseActiveAsset(raw: unknown): ActiveAssetData {
	const data = raw as ActiveAssetCtx;
	return {
		coin: data.coin,
		markPrice: data.ctx.markPx,
		oraclePrice: data.ctx.oraclePx,
		prevDayPx: data.ctx.prevDayPx,
		volume24h: data.ctx.dayNtlVlm,
		openInterest: data.ctx.openInterest,
		fundingRate: data.ctx.funding,
		fundingInterval: '8h',
	};
}

export function parseUserPositions(raw: unknown): Position[] {
	const data = raw as AllDexsClearinghouseState;
	return data.clearinghouseStates.flatMap(([dex, state]) =>
		state.assetPositions.map(({ position: p }): Position => {
			const size = parseFloat(p.szi);
			const absSize = Math.abs(size);
			return {
				coin: dex ? `${dex}:${p.coin}` : p.coin,
				size: absSize.toString(),
				side: size >= 0 ? 'LONG' : 'SHORT',
				entryPrice: p.entryPx,
				unrealizedPnl: p.unrealizedPnl,
				leverage: p.leverage.value.toString(),
				liquidationPrice: p.liquidationPx,
				marginUsed: p.marginUsed,
				funding: p.cumFunding.sinceOpen,
				tp: null,
				sl: null,
			};
		}),
	);
}

const HL_ORDER_TYPE_MAP: Record<string, OrderType> = {
	Limit: 'limit',
	Market: 'market',
	'Take Profit Market': 'tp_market',
	'Stop Market': 'sl_market',
	'Take Profit Limit': 'tp',
	'Stop Limit': 'sl',
};

export function parseUserOpenOrders(raw: unknown): OpenOrder[] {
	const data = raw as HlOpenOrdersResponse;
	return data.orders.map((o): OpenOrder => {
		const tpChild = o.children.find((c) =>
			c.orderType.startsWith('Take Profit'),
		);
		const slChild = o.children.find((c) => c.orderType.startsWith('Stop'));

		return {
			id: o.oid.toString(),
			coin: o.coin,
			side: o.side === 'B' ? 'buy' : 'sell',
			price: parseFloat(o.limitPx),
			size: parseFloat(o.sz),
			origSize: parseFloat(o.origSz),
			filledSize: parseFloat(o.origSz) - parseFloat(o.sz),
			isReduceOnly: o.reduceOnly,
			orderType: HL_ORDER_TYPE_MAP[o.orderType] ?? 'limit',
			triggerPrice: o.isTrigger ? parseFloat(o.triggerPx) : null,
			triggerCondition:
				o.triggerCondition !== 'N/A' ? o.triggerCondition : null,
			tp: tpChild ? parseFloat(tpChild.triggerPx) : null,
			sl: slChild ? parseFloat(slChild.triggerPx) : null,
			status: 'open',
			timestamp: o.timestamp,
		};
	});
}

export function parseCandles(raw: unknown): Candle[] {
	const data = raw as HlCandle[];
	return data.map(parseSingleCandle);
}

export function parseCandle(raw: unknown): Candle {
	return parseSingleCandle(raw as HlCandle);
}

function parseSingleCandle(c: HlCandle): Candle {
	return {
		time: c.t,
		open: c.o,
		high: c.h,
		low: c.l,
		close: c.c,
		volume: c.v,
	};
}

export function parseUserFills(raw: unknown): UserFill[] {
	const data = raw as HlUserFill[];
	return data.map((f) => ({
		id: f.tid.toString(),
		coin: f.coin,
		side: f.side === 'B' ? 'buy' : 'sell',
		dir: f.dir,
		price: parseFloat(f.px),
		size: parseFloat(f.sz),
		closedPnl: parseFloat(f.closedPnl),
		fee: parseFloat(f.fee),
		feeToken: f.feeToken,
		crossed: f.crossed,
		hash: f.hash,
		time: f.time,
	}));
}

export function parseUserBalances(raw: unknown): {
	margin: MarginSummary;
	balances: UserBalance[];
} {
	const data = raw as AllDexsClearinghouseState;
	const balances: UserBalance[] = [];

	let totalAccountValue = 0;
	let totalMarginUsed = 0;
	let totalWithdrawable = 0;

	for (const [dex, state] of data.clearinghouseStates) {
		const av = parseFloat(state.marginSummary.accountValue);
		const mu = parseFloat(state.marginSummary.totalMarginUsed);
		const wd = parseFloat(state.withdrawable);

		totalAccountValue += av;
		totalMarginUsed += mu;
		totalWithdrawable += wd;

		const label = dex ? `USDC (${dex})` : 'USDC (Perps)';
		if (av > 0 || wd > 0) {
			balances.push({
				coin: label,
				totalBalance: av.toFixed(2),
				availableBalance: wd.toFixed(2),
				usdValue: av,
				pnl: 0,
				roi: 0,
				type: 'perps',
			});
		}
	}

	return {
		margin: {
			accountValue: totalAccountValue.toFixed(2),
			totalMarginUsed: totalMarginUsed.toFixed(2),
			withdrawable: totalWithdrawable.toFixed(2),
		},
		balances,
	};
}

export function parseSpotBalances(raw: unknown): UserBalance[] {
	const data = raw as { spotState: { balances: HlSpotBalance[] } };
	const balances = data.spotState?.balances ?? [];

	return balances
		.filter((b) => parseFloat(b.total) > 0)
		.map((b): UserBalance => {
			const total = parseFloat(b.total);
			const hold = parseFloat(b.hold);
			const entryNtl = parseFloat(b.entryNtl);

			return {
				coin: b.coin,
				totalBalance: b.total,
				availableBalance: (total - hold).toString(),
				usdValue: entryNtl > 0 ? entryNtl : total,
				pnl: 0,
				roi: 0,
				type: 'spot',
			};
		});
}

export function parseUserFundings(raw: unknown): FundingPayment[] {
	const data = raw as HlFundingPayment[];
	return data.map((f) => {
		const szi = parseFloat(f.szi);
		return {
			time: f.time,
			coin: f.coin,
			usdc: parseFloat(f.usdc),
			size: Math.abs(szi),
			fundingRate: parseFloat(f.fundingRate),
			side: szi >= 0 ? 'Long' : 'Short',
		};
	});
}

export function parseHistoricalOrders(raw: unknown): HistoricalOrder[] {
	const data = raw as HlHistoricalOrder[];
	return data.map((h) => {
		const o = h.order;
		const origSize = parseFloat(o.origSz);
		const remainingSize = parseFloat(o.sz);
		const filledSize = origSize - remainingSize;

		const tpChild = o.children.find((c) => {
			const child = c as Record<string, unknown>;
			return (child.orderType as string)?.startsWith('Take Profit');
		});
		const slChild = o.children.find((c) => {
			const child = c as Record<string, unknown>;
			return (child.orderType as string)?.startsWith('Stop');
		});

		return {
			id: o.oid.toString(),
			coin: o.coin,
			side: o.side === 'B' ? 'buy' : 'sell',
			orderType: o.orderType,
			dir: o.side === 'B' ? 'Open Long' : 'Open Short',
			price: parseFloat(o.limitPx),
			size: remainingSize,
			filledSize,
			origSize,
			status: h.status,
			reduceOnly: o.reduceOnly,
			triggerCondition:
				o.triggerCondition !== 'N/A' ? o.triggerCondition : null,
			tp: tpChild
				? parseFloat((tpChild as Record<string, unknown>).triggerPx as string)
				: null,
			sl: slChild
				? parseFloat((slChild as Record<string, unknown>).triggerPx as string)
				: null,
			timestamp: o.timestamp,
			statusTimestamp: h.statusTimestamp,
		};
	});
}

export function parseUserTradingContext(raw: unknown): UserTradingContext {
	const data = raw as HlActiveAssetData;
	const marginMode = data.leverage.type === 'isolated' ? 'isolated' : 'cross';

	return {
		coin: data.coin,
		leverage: data.leverage.value,
		marginMode,
		maxTradeSzBuy: parseFloat(data.maxTradeSzs[0]),
		maxTradeSzSell: parseFloat(data.maxTradeSzs[1]),
		availableToTradeBuy: parseFloat(data.availableToTrade[0]),
		availableToTradeSell: parseFloat(data.availableToTrade[1]),
	};
}
