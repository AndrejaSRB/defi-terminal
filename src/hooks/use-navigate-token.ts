import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { useNavigate } from '@tanstack/react-router';
import { activeTokenAtom } from '@/atoms/active-token';

export function useNavigateToken() {
	const setActiveToken = useSetAtom(activeTokenAtom);
	const navigate = useNavigate();

	const navigateToToken = useCallback(
		(token: string) => {
			setActiveToken(token);
			navigate({ to: '/$token', params: { token } });
		},
		[setActiveToken, navigate],
	);

	return navigateToToken;
}
