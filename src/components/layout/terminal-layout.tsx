import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useParams } from '@tanstack/react-router';
import { activeTokenAtom } from '@/atoms/active-token';
import { useMediaQuery } from '@/hooks/use-media-query';
import { TerminalLayoutDesktop } from './terminal-layout-desktop';
import { TerminalLayoutMobile } from './terminal-layout-mobile';

const DEFAULT_TOKEN = 'BTC';

export function TerminalLayout() {
	const { token } = useParams({ strict: false }) as { token?: string };
	const setActiveToken = useSetAtom(activeTokenAtom);
	const isDesktop = useMediaQuery('(min-width: 1024px)');

	// Sync URL token → atom (default to BTC on /)
	useEffect(() => {
		setActiveToken((token ?? DEFAULT_TOKEN).toUpperCase());
	}, [token, setActiveToken]);

	return isDesktop ? <TerminalLayoutDesktop /> : <TerminalLayoutMobile />;
}
