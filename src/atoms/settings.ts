import { atomWithStorage } from 'jotai/utils';

// ── Panel Visibility ──

export type PanelId =
	| 'chart'
	| 'orderbook'
	| 'orderForm'
	| 'records'
	| 'account';

export type PanelVisibility = Record<PanelId, boolean>;

const DEFAULT_VISIBILITY: PanelVisibility = {
	chart: true,
	orderbook: true,
	orderForm: true,
	records: true,
	account: true,
};

export const panelVisibilityAtom = atomWithStorage<PanelVisibility>(
	'panel-visibility',
	DEFAULT_VISIBILITY,
);

export const PANEL_LABELS: Record<PanelId, string> = {
	chart: 'Trading Chart',
	orderbook: 'Order Book',
	orderForm: 'Order Form',
	records: 'Records',
	account: 'Account Overview',
};

export const PANEL_IDS: PanelId[] = [
	'chart',
	'orderbook',
	'orderForm',
	'records',
	'account',
];

// ── Themes ──

export type ThemeId = 'midnight' | 'tokyoNight' | 'dracula';

export const themeAtom = atomWithStorage<ThemeId>('theme', 'midnight');

export interface ThemePreset {
	id: ThemeId;
	name: string;
	colors: {
		primary: string;
		background: string;
		card: string;
		foreground: string;
		muted: string;
		mutedForeground: string;
		border: string;
		accent: string;
	};
}

export const THEME_PRESETS: ThemePreset[] = [
	{
		id: 'midnight',
		name: 'Midnight',
		colors: {
			primary: 'oklch(0.645 0.246 16.439)',
			background: 'oklch(0.141 0.005 285.823)',
			card: 'oklch(0.21 0.006 285.885)',
			foreground: 'oklch(0.985 0 0)',
			muted: 'oklch(0.274 0.006 286.033)',
			mutedForeground: 'oklch(0.705 0.015 286.067)',
			border: 'oklch(1 0 0 / 10%)',
			accent: 'oklch(0.274 0.006 286.033)',
		},
	},
	{
		id: 'tokyoNight',
		name: 'Tokyo Night',
		colors: {
			primary: 'oklch(0.68 0.16 260)',
			background: 'oklch(0.16 0.02 260)',
			card: 'oklch(0.22 0.025 260)',
			foreground: 'oklch(0.92 0.01 260)',
			muted: 'oklch(0.28 0.025 260)',
			mutedForeground: 'oklch(0.65 0.03 260)',
			border: 'oklch(1 0 0 / 10%)',
			accent: 'oklch(0.28 0.025 260)',
		},
	},
	{
		id: 'dracula',
		name: 'Dracula',
		colors: {
			primary: 'oklch(0.7 0.18 310)',
			background: 'oklch(0.17 0.015 300)',
			card: 'oklch(0.23 0.02 300)',
			foreground: 'oklch(0.95 0.01 300)',
			muted: 'oklch(0.29 0.02 300)',
			mutedForeground: 'oklch(0.68 0.025 300)',
			border: 'oklch(1 0 0 / 10%)',
			accent: 'oklch(0.29 0.02 300)',
		},
	},
];

// CSS variable mapping for themes
const CSS_VAR_MAP: Record<keyof ThemePreset['colors'], string[]> = {
	primary: ['--primary', '--sidebar-primary', '--chart-2'],
	background: ['--background'],
	card: ['--card', '--popover', '--sidebar'],
	foreground: [
		'--foreground',
		'--card-foreground',
		'--popover-foreground',
		'--sidebar-foreground',
		'--accent-foreground',
		'--secondary-foreground',
		'--sidebar-accent-foreground',
	],
	muted: ['--muted', '--secondary', '--accent', '--sidebar-accent'],
	mutedForeground: ['--muted-foreground'],
	border: ['--border', '--sidebar-border'],
	accent: [],
};

export const THEME_WRAPPER_ID = 'theme-root';

function getThemeRoot(): HTMLElement {
	// Apply to <html> so Radix portals (rendered outside #theme-root) inherit theme vars.
	// Also clear any stale inline styles on #theme-root to prevent override conflicts.
	const themeWrapper = document.getElementById(THEME_WRAPPER_ID);
	if (themeWrapper) themeWrapper.removeAttribute('style');
	return document.documentElement;
}

export function applyTheme(themeId: ThemeId): void {
	const preset = THEME_PRESETS.find((theme) => theme.id === themeId);
	if (!preset) return;

	const el = getThemeRoot();

	for (const [colorKey, cssVars] of Object.entries(CSS_VAR_MAP)) {
		const value = preset.colors[colorKey as keyof ThemePreset['colors']];
		for (const cssVar of cssVars) {
			el.style.setProperty(cssVar, value);
		}
	}

	// Derived values
	el.style.setProperty('--ring', preset.colors.primary);
	el.style.setProperty('--sidebar-ring', preset.colors.primary);
	el.style.setProperty('--primary-foreground', preset.colors.foreground);
	el.style.setProperty(
		'--sidebar-primary-foreground',
		preset.colors.foreground,
	);
	el.style.setProperty('--input', 'oklch(1 0 0 / 15%)');
}

export function clearThemeOverrides(): void {
	const el = getThemeRoot();
	for (const cssVars of Object.values(CSS_VAR_MAP)) {
		for (const cssVar of cssVars) {
			el.style.removeProperty(cssVar);
		}
	}
	el.style.removeProperty('--ring');
	el.style.removeProperty('--sidebar-ring');
	el.style.removeProperty('--primary-foreground');
	el.style.removeProperty('--sidebar-primary-foreground');
	el.style.removeProperty('--input');
}
