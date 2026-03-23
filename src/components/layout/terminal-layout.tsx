import { useMediaQuery } from '@/hooks/use-media-query';
import { TerminalLayoutDesktop } from './terminal-layout-desktop';
import { TerminalLayoutMobile } from './terminal-layout-mobile';

export function TerminalLayout() {
	const isDesktop = useMediaQuery('(min-width: 1024px)');
	return isDesktop ? <TerminalLayoutDesktop /> : <TerminalLayoutMobile />;
}
