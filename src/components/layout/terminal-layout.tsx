import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useParams } from '@tanstack/react-router';
import { activeTokenAtom } from '@/atoms/active-token';
import { activeNormalizerAtom } from '@/atoms/dex';
import { THEME_WRAPPER_ID } from '@/atoms/settings';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useTheme } from '@/hooks/use-theme';
import { TerminalLayoutDesktop } from './terminal-layout-desktop';
import { TerminalLayoutMobile } from './terminal-layout-mobile';

export function TerminalLayout() {
	const { token } = useParams({ strict: false }) as { token?: string };
	const normalizer = useAtomValue(activeNormalizerAtom);
	const setActiveToken = useSetAtom(activeTokenAtom);
	const isDesktop = useMediaQuery('(min-width: 1024px)');
	useTheme();

	// Sync URL token → atom — pass exact value, no transformation
	useEffect(() => {
		setActiveToken(token ?? normalizer.defaultToken);
	}, [token, setActiveToken, normalizer.defaultToken]);

	return (
		<div id={THEME_WRAPPER_ID} className="contents">
			{isDesktop ? <TerminalLayoutDesktop /> : <TerminalLayoutMobile />}
		</div>
	);
}
