import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { activeTokenAtom } from '@/atoms/active-token';

export function useNavigateToken() {
	const setActiveToken = useSetAtom(activeTokenAtom);

	const navigateToToken = useCallback(
		(token: string) => {
			setActiveToken(token);
			// Use raw path to avoid TanStack Router encoding `:` as `%3A`
			window.history.replaceState(null, '', `/${token}`);
		},
		[setActiveToken],
	);

	return navigateToToken;
}
