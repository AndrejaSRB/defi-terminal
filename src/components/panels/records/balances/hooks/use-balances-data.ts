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
		return all.map(
			(b): FormattedBalance => ({
				coin: b.coin,
				totalBalance: `${b.totalBalance} ${b.coin.includes('USDC') ? 'USDC' : b.coin}`,
				availableBalance: `${b.availableBalance} ${b.coin.includes('USDC') ? 'USDC' : b.coin}`,
				usdValue: `$${b.usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
				type: b.type,
			}),
		);
	}, [perps, spot]);

	return { balances, isEmpty: balances.length === 0 };
}
