import { useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
	denominationAtom,
	type Denomination,
} from '@/atoms/market-data/denomination';
import { activeTokenAtom } from '@/atoms/active-token';
import { formatTokenName } from '@/lib/token';

export function useDenomination() {
	const denom = useAtomValue(denominationAtom);
	const setDenom = useSetAtom(denominationAtom);
	const token = useAtomValue(activeTokenAtom);
	const tokenLabel = formatTokenName(token);
	const set = useCallback((val: Denomination) => setDenom(val), [setDenom]);
	return { denom, setDenom: set, tokenLabel };
}
