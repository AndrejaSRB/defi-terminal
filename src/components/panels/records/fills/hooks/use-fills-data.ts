import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { userFillsAtom } from '@/atoms/user/fills';
import { activeNormalizerAtom } from '@/atoms/dex';
import { parseTokenName } from '@/lib/token';

export interface FormattedFill {
	id: string;
	coin: string;
	displayName: string;
	dexName: string | null;
	dir: string;
	price: string;
	size: string;
	tradeValue: string;
	fee: string;
	closedPnl: string;
	closedPnlValue: number;
	time: string;
}

function formatTime(ts: number): string {
	const d = new Date(ts);
	const date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
	const time = d.toLocaleTimeString('en-US', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
	return `${date} ${time}`;
}

export function useFillsData() {
	const fills = useAtomValue(userFillsAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);

	const formatted = useMemo(() => {
		return fills.map((f): FormattedFill => {
			const { formattedTokenName, dexName } = parseTokenName(f.coin);
			const tradeValue = f.price * f.size;

			return {
				id: f.id,
				coin: f.coin,
				displayName: formattedTokenName,
				dexName,
				dir: f.dir,
				price: normalizer.formatPrice(f.price, f.coin),
				size: `${normalizer.formatSize(f.size, f.coin)} ${formattedTokenName}`,
				tradeValue: `${tradeValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${f.feeToken}`,
				fee: `${Math.abs(f.fee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${f.feeToken}`,
				closedPnl:
					f.closedPnl === 0 && !f.hash
						? '—'
						: `${f.closedPnl >= 0 ? '+' : '-'}$${Math.abs(f.closedPnl).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
				closedPnlValue: f.closedPnl,
				time: formatTime(f.time),
			};
		});
	}, [fills, normalizer]);

	return { fills: formatted, isEmpty: formatted.length === 0 };
}
