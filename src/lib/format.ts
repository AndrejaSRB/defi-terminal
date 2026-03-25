import type {
	DexNormalizer,
	FormatPriceOptions,
} from '@/normalizer/normalizer';

export function safeFormatPrice(
	normalizer: DexNormalizer,
	value: number,
	coin: string,
	options?: FormatPriceOptions,
): string {
	try {
		return normalizer.formatPrice(value, coin, options);
	} catch {
		return '--';
	}
}

export function safeFormatSize(
	normalizer: DexNormalizer,
	value: number,
	coin: string,
): string {
	try {
		return normalizer.formatSize(value, coin);
	} catch {
		return '--';
	}
}
