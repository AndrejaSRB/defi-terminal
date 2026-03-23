import { useCallback, useState } from 'react';
import { useSetAtom } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';

export function useTokenSelector() {
	const [isOpen, setIsOpen] = useState(false);
	const setActiveToken = useSetAtom(activeTokenAtom);

	const open = useCallback(() => setIsOpen(true), []);
	const close = useCallback(() => setIsOpen(false), []);
	const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
	const selectToken = useCallback(
		(symbol: string) => {
			setActiveToken(symbol);
			setIsOpen(false);
		},
		[setActiveToken],
	);

	return { isOpen, open, close, toggle, selectToken };
}
