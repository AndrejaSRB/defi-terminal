import { cssVarToHex } from '@/lib/css-to-hex';

/** Color-only overrides — safe for both constructor and runtime applyOverrides */
export function getColorOverrides() {
	const background = cssVarToHex('--card');
	const textColor = cssVarToHex('--muted-foreground');

	return {
		'paneProperties.background': background,
		'paneProperties.backgroundType': 'solid' as const,
		'paneProperties.vertGridProperties.color': 'rgba(255,255,255,0.04)',
		'paneProperties.horzGridProperties.color': 'rgba(255,255,255,0.04)',
		'mainSeriesProperties.candleStyle.upColor': '#4ade80',
		'mainSeriesProperties.candleStyle.downColor': '#f87171',
		'mainSeriesProperties.candleStyle.borderUpColor': '#4ade80',
		'mainSeriesProperties.candleStyle.borderDownColor': '#f87171',
		'mainSeriesProperties.candleStyle.wickUpColor': '#4ade80',
		'mainSeriesProperties.candleStyle.wickDownColor': '#f87171',
		'scalesProperties.textColor': textColor,
		'crossHairProperties.color': textColor,
	};
}

/** Full overrides for constructor */
export function getChartOverrides() {
	return {
		...getColorOverrides(),
	};
}

export function getToolbarBg() {
	return cssVarToHex('--card');
}

export function getLoadingScreen() {
	return {
		backgroundColor: cssVarToHex('--card'),
		foregroundColor: cssVarToHex('--muted-foreground'),
	};
}

export const STUDIES_OVERRIDES = {
	'volume.volume.color.0': '#f87171',
	'volume.volume.color.1': '#4ade80',
};

/** Apply theme colors to TradingView via CSS custom properties + iframe style injection */
// biome-ignore lint: widget type is broader than IChartingLibraryWidget
export function applyWidgetTheme(widget: any, container: HTMLElement): void {
	const bg = cssVarToHex('--card');
	const text = cssVarToHex('--muted-foreground');
	const border = cssVarToHex('--border');
	const muted = cssVarToHex('--muted');
	const primary = cssVarToHex('--primary');

	// 1. CSS custom properties for areas that respect them (top toolbar)
	widget.setCSSCustomProperty('--tv-color-platform-background', bg);
	widget.setCSSCustomProperty('--tv-color-pane-background', bg);
	widget.setCSSCustomProperty('--tv-color-toolbar-button-text', text);
	widget.setCSSCustomProperty('--tv-color-toolbar-button-text-hover', text);
	widget.setCSSCustomProperty('--tv-color-toolbar-divider-background', border);
	widget.setCSSCustomProperty(
		'--tv-color-toolbar-button-background-hover',
		muted,
	);
	widget.setCSSCustomProperty(
		'--tv-color-toolbar-button-background-expanded',
		muted,
	);
	widget.setCSSCustomProperty(
		'--tv-color-toolbar-button-background-active',
		bg,
	);
	widget.setCSSCustomProperty(
		'--tv-color-toolbar-button-background-active-hover',
		muted,
	);
	widget.setCSSCustomProperty(
		'--tv-color-toolbar-toggle-button-background-active',
		bg,
	);
	widget.setCSSCustomProperty(
		'--tv-color-toolbar-toggle-button-background-active-hover',
		muted,
	);
	widget.setCSSCustomProperty('--tv-color-toolbar-button-text-active', primary);
	widget.setCSSCustomProperty(
		'--tv-color-toolbar-button-text-active-hover',
		primary,
	);
	widget.setCSSCustomProperty('--tv-color-item-active-text', primary);

	// 2. Chart canvas overrides
	widget.applyOverrides(
		getColorOverrides() as unknown as Record<string, unknown>,
	);

	// 3. Inject CSS into iframe for left/bottom toolbars that ignore CSS custom properties
	const iframe = container.querySelector<HTMLIFrameElement>(
		'iframe[id^="tradingview"]',
	);
	if (!iframe) return;
	try {
		const doc = iframe.contentDocument;
		if (!doc?.head) return;

		const styleId = 'terminal-theme';
		let style = doc.getElementById(styleId) as HTMLStyleElement | null;
		if (!style) {
			style = doc.createElement('style');
			style.id = styleId;
			doc.head.appendChild(style);
		}
		style.textContent = `
			.layout__area--left,
			.layout__area--left *,
			.layout__area--right,
			.layout__area--right *,
			.chart-controls-bar,
			.chart-controls-bar * {
				background-color: ${bg} !important;
			}
		`;
	} catch {
		// Ignore if iframe not accessible
	}
}

export const DISABLED_FEATURES = [
	'header_symbol_search',
	'header_compare',
	'symbol_search_hot_key',
	'header_saveload',
];

export const ENABLED_FEATURES = [
	'study_templates',
	'iframe_loading_same_origin',
	'use_localstorage_for_settings',
];
