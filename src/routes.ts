import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
} from '@tanstack/react-router';
import { TerminalLayout } from '@/components/layout/terminal-layout';

const rootRoute = createRootRoute({
	component: Outlet,
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	component: TerminalLayout,
});

export const tokenRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/$token',
	component: TerminalLayout,
});

const routeTree = rootRoute.addChildren([indexRoute, tokenRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
}
