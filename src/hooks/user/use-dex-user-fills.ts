import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { toast } from 'sonner';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { userFillsAtom } from '@/atoms/user/fills';
import type { UserFill } from '@/normalizer/types';
import { useAuth } from '../use-auth';

const MAX_FILLS = 200;

function notifyFill(
	fill: UserFill,
	normalizer: {
		formatSize: (value: number, coin: string) => string;
		formatPrice: (value: number, coin: string) => string;
	},
) {
	const isBuy = fill.side === 'buy';
	const isClose = fill.dir.startsWith('Close');
	const title = isClose ? 'Position Closed' : 'Order Filled';
	const sizeFormatted = normalizer.formatSize(fill.size, fill.coin);
	const priceFormatted = normalizer.formatPrice(fill.price, fill.coin);
	const pnlText =
		fill.closedPnl !== 0
			? ` — PnL: ${fill.closedPnl >= 0 ? '+' : ''}$${Math.abs(fill.closedPnl).toFixed(2)}`
			: '';

	toast.success(title, {
		description: `${isBuy ? 'Buy' : 'Sell'} ${sizeFormatted} ${fill.coin} @ ${priceFormatted}${pnlText}`,
		duration: 8000,
	});
}

export function useDexUserFills() {
	const normalizer = useAtomValue(activeNormalizerAtom);
	const { walletAddress } = useAuth();
	const setFills = useSetAtom(userFillsAtom);

	useEffect(() => {
		if (!walletAddress) {
			setFills([]);
			return;
		}

		if (!normalizer.channels.userFills || !normalizer.parseUserFills) return;

		const channel = normalizer.channels.userFills(walletAddress);
		const parse = normalizer.parseUserFills;
		let hasSnapshot = false;

		const unsub = tradingWs.subscribe(channel, (raw) => {
			const wsData = raw as { isSnapshot?: boolean; fills?: unknown[] };
			const fills = parse(wsData.fills ?? raw);

			if (wsData.isSnapshot || !hasSnapshot) {
				hasSnapshot = true;
				setFills(fills.reverse().slice(0, MAX_FILLS));
			} else {
				// Live fills — notify user
				for (const fill of fills) {
					notifyFill(fill, normalizer);
				}
				setFills((prev) => [...fills, ...prev].slice(0, MAX_FILLS));
			}
		});

		return unsub;
	}, [normalizer, walletAddress, setFills]);
}
