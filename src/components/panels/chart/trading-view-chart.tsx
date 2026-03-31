import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { tradingWs } from '@/services/ws';
import { themeAtom } from '@/atoms/settings';
import { useChartData } from './hooks/use-chart-data';
import { useChartLines } from './hooks/use-chart-lines';
import { createDatafeed } from './datafeed';
import { LocalStorageSaveLoadAdapter } from './chart-storage';
import {
	getChartOverrides,
	getToolbarBg,
	getLoadingScreen,
	applyWidgetTheme,
	STUDIES_OVERRIDES,
	DISABLED_FEATURES,
	ENABLED_FEATURES,
} from './chart-overrides';
import type { DatafeedWithDispose } from './datafeed';
import type { IChartingLibraryWidget } from '@charting_library/charting_library';
import type { ResolutionString } from '@charting_library/datafeed-api';

let scriptPromise: Promise<void> | null = null;

function loadTradingViewScript(): Promise<void> {
	if (scriptPromise) return scriptPromise;

	scriptPromise = new Promise((resolve, reject) => {
		if ((window as unknown as Record<string, unknown>).TradingView) {
			resolve();
			return;
		}

		const script = document.createElement('script');
		script.src = '/charting_library/charting_library.standalone.js';
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => {
			scriptPromise = null;
			reject(new Error('Failed to load TradingView library'));
		};
		document.head.appendChild(script);
	});

	return scriptPromise;
}

const saveLoadAdapter = new LocalStorageSaveLoadAdapter();

export default function TradingViewChart() {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetRef = useRef<IChartingLibraryWidget | null>(null);
	const datafeedRef = useRef<DatafeedWithDispose | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);

	const { token, normalizer, assetMetaReady, getPrice } = useChartData();
	const themeId = useAtomValue(themeAtom);
	useChartLines(widgetRef, isReady);

	// Widget init
	useEffect(() => {
		if (!assetMetaReady) return;

		let disposed = false;

		async function init() {
			try {
				await loadTradingViewScript();
			} catch (initError) {
				if (!disposed) {
					setError(
						initError instanceof Error
							? initError.message
							: 'Failed to load chart',
					);
				}
				return;
			}

			if (disposed || !containerRef.current) return;

			const TV = (window as unknown as Record<string, unknown>).TradingView as {
				widget: new (
					options: Record<string, unknown>,
				) => IChartingLibraryWidget;
			};

			const df = createDatafeed(normalizer, tradingWs, getPrice);
			datafeedRef.current = df;

			const widget = new TV.widget({
				container: containerRef.current,
				datafeed: df.datafeed,
				library_path: '/charting_library/',
				symbol: token,
				interval: '5' as ResolutionString,
				locale: 'en',
				theme: 'dark',
				fullscreen: false,
				autosize: true,
				timezone: 'Etc/UTC',
				toolbar_bg: getToolbarBg(),
				disabled_features: DISABLED_FEATURES,
				enabled_features: ENABLED_FEATURES,
				overrides: getChartOverrides(),
				studies_overrides: STUDIES_OVERRIDES,
				loading_screen: getLoadingScreen(),
				time_scale: { min_bar_spacing: 4 },
				save_load_adapter: saveLoadAdapter,
				auto_save_delay: 2,
				load_last_chart: true,
			});

			widgetRef.current = widget;

			widget.onChartReady(() => {
				if (disposed) return;
				if (containerRef.current) {
					applyWidgetTheme(widget, containerRef.current);
				}

				// Initial save
				widget.saveChartToServer(undefined, undefined, {
					defaultChartName: 'default',
				});

				// Debounced save — prevents excessive saves during drag operations
				let saveTimer: ReturnType<typeof setTimeout> | null = null;
				const debouncedSave = () => {
					if (disposed) return;
					if (saveTimer) clearTimeout(saveTimer);
					saveTimer = setTimeout(() => {
						if (!disposed) widget.saveChartToServer();
					}, 1000);
				};

				const handleDrawingEvent = (_sourceId: unknown, eventType: string) => {
					// Save on meaningful changes, skip click (read-only)
					if (eventType === 'click') return;
					debouncedSave();
				};

				const handleStudyEvent = () => {
					debouncedSave();
				};

				widget.subscribe('drawing_event', handleDrawingEvent);
				widget.subscribe('study_event', handleStudyEvent);

				setIsReady(true);
			});
		}

		const unsubState = tradingWs.onStateChange((state) => {
			if (state === 'connected' && datafeedRef.current) {
				datafeedRef.current.fillGap().catch((gapError) => {
					console.error('[Chart] Gap fill failed:', gapError);
				});
			}
		});

		init();

		return () => {
			disposed = true;
			unsubState();
			if (widgetRef.current) {
				widgetRef.current.remove();
				widgetRef.current = null;
			}
			if (datafeedRef.current) {
				datafeedRef.current.dispose();
				datafeedRef.current = null;
			}
			setIsReady(false);
			setError(null);
		};
	}, [normalizer, assetMetaReady, retryCount, getPrice]);

	// Live theme sync — only applies when themeId actually changes
	const prevThemeRef = useRef(themeId);
	useEffect(() => {
		if (!isReady || !widgetRef.current || !containerRef.current) return;
		if (prevThemeRef.current === themeId) return;
		prevThemeRef.current = themeId;

		try {
			applyWidgetTheme(widgetRef.current, containerRef.current);
		} catch (overrideError) {
			console.warn('[Chart] Failed to apply theme overrides:', overrideError);
		}
	}, [themeId, isReady]);

	// Symbol switch
	useEffect(() => {
		if (!isReady || !widgetRef.current) return;
		const chart = widgetRef.current.activeChart();
		chart.setSymbol(token);
	}, [token, isReady]);

	if (error) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div className="text-center">
					<p className="mb-2 text-sm text-muted-foreground">{error}</p>
					<button
						type="button"
						onClick={() => {
							setError(null);
							setRetryCount((c) => c + 1);
						}}
						className="text-sm text-primary underline"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	return <div ref={containerRef} className="h-full w-full" />;
}
