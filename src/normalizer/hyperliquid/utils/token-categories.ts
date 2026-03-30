import type { TokenCategory } from '@/normalizer/normalizer';

export const hlTokenCategories: TokenCategory[] = [
	{ id: 'all', label: 'All', filter: () => true },
	{ id: 'perps', label: 'Perps', filter: (coin) => !coin.includes(':') },
	{ id: 'hip3', label: 'HIP3', filter: (coin) => coin.includes(':') },
];
