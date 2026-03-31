import type { TokenCategory } from '@/normalizer/normalizer';

export const extTokenCategories: TokenCategory[] = [
	{ id: 'all', label: 'All', filter: () => true },
];
