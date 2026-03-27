import { atom } from 'jotai';
import { safeParseFloat } from '@/lib/numbers';
import { userMarginAtom, userSpotBalancesAtom } from './balances';
import { userPositionsAtom } from './positions';
import { pricesAtom } from '../prices';

// ── Spot equity: sum of all spot balance USD values ─────────────────
export const spotEquityAtom = atom((get) => {
	const balances = get(userSpotBalancesAtom);
	return balances.reduce((sum, balance) => sum + balance.usdValue, 0);
});

// ── Perps equity: accountValue from margin summary ──────────────────
export const perpsEquityAtom = atom((get) => {
	const margin = get(userMarginAtom);
	return margin ? safeParseFloat(margin.accountValue) : 0;
});

// ── Portfolio Value: spot + perps ───────────────────────────────────
export const portfolioValueAtom = atom((get) => {
	return get(spotEquityAtom) + get(perpsEquityAtom);
});

// ── Balance: withdrawable amount ────────────────────────────────────
export const balanceAtom = atom((get) => {
	const margin = get(userMarginAtom);
	return margin ? safeParseFloat(margin.withdrawable) : 0;
});

// ── Unrealized PnL: sum across all positions using live prices ──────
export const unrealizedPnlAtom = atom((get) => {
	const positions = get(userPositionsAtom);
	const prices = get(pricesAtom);

	let total = 0;
	for (const position of positions) {
		const size = safeParseFloat(position.size);
		const entry = safeParseFloat(position.entryPrice);
		const mark = safeParseFloat(prices[position.coin], entry);
		const direction = position.side === 'LONG' ? 1 : -1;
		total += (mark - entry) * size * direction;
	}
	return total;
});

// ── Cross Margin Ratio: maintenanceMargin / accountValue ────────────
export const crossMarginRatioAtom = atom((get) => {
	const margin = get(userMarginAtom);
	if (!margin) return 0;
	const accountValue = safeParseFloat(margin.accountValue);
	const maintenanceMargin = safeParseFloat(margin.crossMaintenanceMarginUsed);
	return accountValue > 0 ? (maintenanceMargin / accountValue) * 100 : 0;
});

// ── Maintenance Margin: crossMaintenanceMarginUsed ──────────────────
export const maintenanceMarginAtom = atom((get) => {
	const margin = get(userMarginAtom);
	return margin ? safeParseFloat(margin.crossMaintenanceMarginUsed) : 0;
});

// ── Cross Account Leverage: total notional / accountValue ───────────
export const crossAccountLeverageAtom = atom((get) => {
	const positions = get(userPositionsAtom);
	const prices = get(pricesAtom);
	const margin = get(userMarginAtom);
	const accountValue = margin ? safeParseFloat(margin.accountValue) : 0;

	if (accountValue <= 0) return 0;

	let totalNotional = 0;
	for (const position of positions) {
		const size = safeParseFloat(position.size);
		const mark = safeParseFloat(
			prices[position.coin],
			safeParseFloat(position.entryPrice),
		);
		totalNotional += size * mark;
	}
	return totalNotional / accountValue;
});
