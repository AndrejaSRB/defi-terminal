import { useCallback, useState } from 'react';
import { useNavigateToken } from '@/hooks/use-navigate-token';

export function useTokenSelector() {
	const [isOpen, setIsOpen] = useState(false);
	const navigateToToken = useNavigateToken();

	const open = useCallback(() => setIsOpen(true), []);
	const close = useCallback(() => setIsOpen(false), []);
	const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
	const selectToken = useCallback(
		(symbol: string) => {
			navigateToToken(symbol);
			setIsOpen(false);
		},
		[navigateToToken],
	);

	return { isOpen, open, close, toggle, selectToken };
}
