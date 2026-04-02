import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { fetchLifiRoutes } from '@/services/lifi/routes';
import { useCountdown } from '@/hooks/use-countdown';
import type { Route } from '@lifi/sdk';

const DEBOUNCE_MS = 800;
const REFRESH_SECONDS = 30;

interface UseWidgetRoutesParams {
	fromChainId: number | undefined;
	toChainId: number;
	fromTokenAddress: string | undefined;
	toTokenAddress: string;
	fromAmount: string;
	fromAddress: string | undefined;
	enabled: boolean;
}

export function useWidgetRoutes(params: UseWidgetRoutesParams) {
	const {
		fromChainId,
		toChainId,
		fromTokenAddress,
		toTokenAddress,
		fromAmount,
		fromAddress,
		enabled,
	} = params;

	const [routes, setRoutes] = useState<Route[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Stable ref for fetch params to avoid stale closures
	const paramsRef = useRef(params);
	paramsRef.current = params;

	const doFetch = useCallback(async () => {
		const current = paramsRef.current;
		if (
			!current.enabled ||
			!current.fromChainId ||
			!current.fromTokenAddress ||
			!current.fromAddress ||
			!current.fromAmount
		) {
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const routes = await fetchLifiRoutes({
				fromChainId: current.fromChainId,
				toChainId: current.toChainId,
				fromTokenAddress: current.fromTokenAddress,
				toTokenAddress: current.toTokenAddress,
				fromAmount: current.fromAmount,
				fromAddress: current.fromAddress,
			});
			setRoutes(routes);
		} catch (fetchError) {
			const message =
				fetchError instanceof Error
					? fetchError.message
					: 'Failed to get routes';
			setError(message);
			setRoutes([]);
			toast.error(message);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const countdown = useCountdown({
		duration: REFRESH_SECONDS,
		onExpire: doFetch,
	});
	const countdownRef = useRef(countdown);
	countdownRef.current = countdown;

	// Debounced fetch when inputs change
	useEffect(() => {
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		setRoutes([]);
		setError(null);
		countdownRef.current.stop();

		if (
			!enabled ||
			!fromChainId ||
			!fromTokenAddress ||
			!fromAddress ||
			!fromAmount
		) {
			setIsLoading(false);
			return;
		}

		setIsLoading(true);

		debounceTimer.current = setTimeout(async () => {
			await doFetch();
			countdownRef.current.start();
		}, DEBOUNCE_MS);

		return () => {
			if (debounceTimer.current) clearTimeout(debounceTimer.current);
		};
	}, [
		fromChainId,
		toChainId,
		fromTokenAddress,
		toTokenAddress,
		fromAmount,
		fromAddress,
		enabled,
		doFetch,
	]);

	return {
		routes,
		isLoading,
		error,
		secondsLeft: countdown.secondsLeft,
		isCountdownRunning: countdown.isRunning,
		refresh: doFetch,
	};
}
