import { THEME_WRAPPER_ID } from '@/atoms/settings';

/**
 * Reads a computed CSS variable from the theme wrapper and converts to hex.
 * Uses an offscreen canvas to let the browser resolve oklch/hsl/rgb → hex.
 */
const canvas = document.createElement('canvas');
canvas.width = 1;
canvas.height = 1;
const ctx = canvas.getContext('2d')!;

export function cssVarToHex(varName: string): string {
	const el =
		document.getElementById(THEME_WRAPPER_ID) ?? document.documentElement;
	const value = getComputedStyle(el).getPropertyValue(varName).trim();
	if (!value) return '#000000';

	ctx.clearRect(0, 0, 1, 1);
	ctx.fillStyle = '#000000';
	ctx.fillStyle = value;
	ctx.fillRect(0, 0, 1, 1);

	const [red, green, blue] = ctx.getImageData(0, 0, 1, 1).data;
	return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
}
