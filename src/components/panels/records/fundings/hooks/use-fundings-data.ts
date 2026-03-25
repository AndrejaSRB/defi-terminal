import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { userFundingsAtom } from '@/atoms/user/fundings';
import { activeNormalizerAtom } from '@/atoms/dex';
import { parseTokenName } from '@/lib/token';

export interface FormattedFunding {
	id: string;
	coin: string;
	displayName: string;
	dexName: string | null;
	size: string;
	side: 'Long' | 'Short';
	payment: string;
	paymentValue: number;
	rate: string;
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
	return `${date} - ${time}`;
}

export function useFundingsData() {
	const fundings = useAtomValue(userFundingsAtom);
	const normalizer = useAtomValue(activeNormalizerAtom);

	const formatted = useMemo(() => {
		return fundings.map((funding, i): FormattedFunding => {
			const { formattedTokenName, dexName } = parseTokenName(funding.coin);

			return {
				id: `${funding.time}-${funding.coin}-${i}`,
				coin: funding.coin,
				displayName: formattedTokenName,
				dexName,
				size: `${normalizer.formatSize(funding.size, funding.coin)} ${formattedTokenName}`,
				side: funding.side,
				payment: `${funding.usdc < 0 ? '-' : ''}${Math.abs(funding.usdc).toFixed(4)} USDC`,
				paymentValue: funding.usdc,
				rate: `${(Math.abs(funding.fundingRate) * 100).toFixed(4)}%`,
				time: formatTime(funding.time),
			};
		});
	}, [fundings, normalizer]);

	return { fundings: formatted, isEmpty: formatted.length === 0 };
}
