import type { TokenCategory } from '@/normalizer/normalizer';

const HL_INFO_URL = 'https://api.hyperliquid.xyz/info';

// Module-level annotation map — populated by fetchAnnotations()
const annotationsMap = new Map<
	string,
	{ category: string; displayName?: string }
>();

/** Fetch perpConciseAnnotations and build category data */
export async function fetchAnnotations(): Promise<void> {
	try {
		const response = await fetch(HL_INFO_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ type: 'perpConciseAnnotations' }),
		});
		if (!response.ok) return;

		const data = (await response.json()) as [
			string,
			{ category: string; displayName?: string },
		][];

		annotationsMap.clear();
		for (const [coin, meta] of data) {
			annotationsMap.set(coin, meta);
		}
	} catch {
		// Non-critical — fall back to default "all" category
	}
}

/** Get the category for a coin. Unannotated coins are "crypto". */
export function getCoinCategory(coin: string): string {
	return annotationsMap.get(coin)?.category ?? 'crypto';
}

const CATEGORY_LABELS: Record<string, string> = {
	crypto: 'Crypto',
	stocks: 'Stocks',
	commodities: 'Commodities',
	indices: 'Indices',
	fx: 'FX',
	preipo: 'Pre-IPO',
};

/** Build token categories dynamically from fetched annotations. */
export function buildTokenCategories(): TokenCategory[] {
	const categories: TokenCategory[] = [
		{ id: 'all', label: 'All', filter: () => true },
	];

	// Collect unique categories from annotations
	const seen = new Set<string>();
	for (const [, meta] of annotationsMap) {
		seen.add(meta.category);
	}

	// Always include "crypto" — unannotated tokens default to it
	seen.add('crypto');

	// Sort: crypto first, then alphabetical
	const sorted = [...seen].sort((a, b) => {
		if (a === 'crypto') return -1;
		if (b === 'crypto') return 1;
		return a.localeCompare(b);
	});

	for (const category of sorted) {
		categories.push({
			id: category,
			label: CATEGORY_LABELS[category] ?? category,
			filter: (coin) => getCoinCategory(coin) === category,
		});
	}

	return categories;
}
