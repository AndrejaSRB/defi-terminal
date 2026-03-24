export const CHART_OVERRIDES = {
	'paneProperties.background': '#1a1a2e',
	'paneProperties.backgroundType': 'solid',

	'paneProperties.vertGridProperties.color': 'rgba(255,255,255,0.04)',
	'paneProperties.horzGridProperties.color': 'rgba(255,255,255,0.04)',

	'mainSeriesProperties.candleStyle.upColor': '#4ade80',
	'mainSeriesProperties.candleStyle.downColor': '#f87171',
	'mainSeriesProperties.candleStyle.borderUpColor': '#4ade80',
	'mainSeriesProperties.candleStyle.borderDownColor': '#f87171',
	'mainSeriesProperties.candleStyle.wickUpColor': '#4ade80',
	'mainSeriesProperties.candleStyle.wickDownColor': '#f87171',

	'mainSeriesProperties.minBarSpacing': 4,

	'scalesProperties.textColor': '#a1a1aa',

	'crossHairProperties.color': '#a1a1aa',
};

export const STUDIES_OVERRIDES = {
	'volume.volume.color.0': '#f87171',
	'volume.volume.color.1': '#4ade80',
};

export const DISABLED_FEATURES = [
	'header_symbol_search',
	'header_compare',
	'symbol_search_hot_key',
	'header_saveload',
];

export const ENABLED_FEATURES = ['study_templates'];

export const LOADING_SCREEN = {
	backgroundColor: '#1a1a2e',
	foregroundColor: '#a1a1aa',
};
