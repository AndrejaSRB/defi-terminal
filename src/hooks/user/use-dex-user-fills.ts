import { useEffect, useCallback, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { toast } from 'sonner';
import { tradingWs } from '@/services/ws';
import { activeNormalizerAtom } from '@/atoms/dex';
import { userFillsAtom } from '@/atoms/user/fills';
import { activeRecordsTabAtom } from '@/atoms/ui/records-tab';
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
			? ` - PnL: ${fill.closedPnl >= 0 ? '+' : ''}$${Math.abs(fill.closedPnl).toFixed(2)}`
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
	const activeTab = useAtomValue(activeRecordsTabAtom);
	const hasSnapshotRef = useRef(false);

	const handleData = useCallback(
		(raw: unknown) => {
			if (!normalizer.parseUserFills) return;
			const wsData = raw as { isSnapshot?: boolean; fills?: unknown[] };
			const fills = normalizer.parseUserFills(wsData.fills ?? raw);

			if (wsData.isSnapshot || !hasSnapshotRef.current) {
				hasSnapshotRef.current = true;
				setFills(fills.reverse().slice(0, MAX_FILLS));
			} else {
				for (const fill of fills) {
					notifyFill(fill, normalizer);
				}
				setFills((prev) => [...fills, ...prev].slice(0, MAX_FILLS));
			}
		},
		[normalizer, setFills],
	);

	const handleReconnect = useCallback(() => {
		normalizer
			.fetchUserFills?.(walletAddress!, MAX_FILLS)
			.then((fills) => setFills(fills))
			.catch(() => {});
	}, [normalizer, walletAddress, setFills]);

	useEffect(() => {
		if (!walletAddress) {
			setFills([]);
			return;
		}

		// WS path
		if (normalizer.channels.userFills && normalizer.parseUserFills) {
			hasSnapshotRef.current = false;
			const channel = normalizer.channels.userFills(walletAddress);
			const unsub = tradingWs.subscribe(channel, handleData, {
				onReconnect: handleReconnect,
			});

			return unsub;
		}

		// REST fallback (Extended)
		if (normalizer.fetchUserFills) {
			normalizer
				.fetchUserFills(walletAddress, MAX_FILLS)
				.then((fills) => setFills(fills))
				.catch(() => setFills([]));
		}
	}, [
		normalizer,
		walletAddress,
		setFills,
		activeTab,
		handleData,
		handleReconnect,
	]);
}
