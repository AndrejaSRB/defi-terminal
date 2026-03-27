import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useParams } from '@tanstack/react-router';
import { activeTokenAtom } from '@/atoms/active-token';
import { THEME_WRAPPER_ID } from '@/atoms/settings';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useTheme } from '@/hooks/use-theme';
import { TerminalLayoutDesktop } from './terminal-layout-desktop';
import { TerminalLayoutMobile } from './terminal-layout-mobile';

const DEFAULT_TOKEN = 'BTC';

export function TerminalLayout() {
	const { token } = useParams({ strict: false }) as { token?: string };
	const setActiveToken = useSetAtom(activeTokenAtom);
	const isDesktop = useMediaQuery('(min-width: 1024px)');
	useTheme();

	// Sync URL token → atom (default to BTC on /)
	useEffect(() => {
		setActiveToken((token ?? DEFAULT_TOKEN).toUpperCase());
	}, [token, setActiveToken]);

	return (
		<div id={THEME_WRAPPER_ID} className="contents">
			{isDesktop ? <TerminalLayoutDesktop /> : <TerminalLayoutMobile />}
		</div>
	);
}
