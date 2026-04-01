import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import {
	userPerpsBalancesAtom,
	userSpotBalancesAtom,
} from '@/atoms/user/balances';

export interface FormattedBalance {
	coin: string;
	totalBalance: string;
	availableBalance: string;
	usdValue: string;
	type: 'perps' | 'spot';
}

export function useBalancesData() {
	const perps = useAtomValue(userPerpsBalancesAtom);
	const spot = useAtomValue(userSpotBalancesAtom);

	const balances = useMemo(() => {
		const all = [...perps, ...spot];
		const fmt = (value: string) =>
			parseFloat(value).toLocaleString('en-US', {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			});
		return all.map(
			(balance): FormattedBalance => ({
				coin: balance.coin,
				totalBalance: `${fmt(balance.totalBalance)} ${balance.coin.includes('USDC') ? 'USDC' : balance.coin}`,
				availableBalance: `${fmt(balance.availableBalance)} ${balance.coin.includes('USDC') ? 'USDC' : balance.coin}`,
				usdValue: `$${balance.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
				type: balance.type,
			}),
		);
	}, [perps, spot]);

	return { balances, isEmpty: balances.length === 0 };
}
