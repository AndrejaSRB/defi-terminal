import { atom } from 'jotai';
import { activeNormalizerAtom } from '@/atoms/dex';
import { walletAddressAtom } from './onboarding';

function buildStorageKey(dexName: string, wallet: string | null): string {
	return `favorites:${dexName}:${wallet ?? 'anonymous'}`;
}

function readFavorites(key: string): string[] {
	try {
		const stored = localStorage.getItem(key);
		return stored ? (JSON.parse(stored) as string[]) : [];
	} catch {
		return [];
	}
}

function writeFavorites(key: string, favorites: string[]): void {
	localStorage.setItem(key, JSON.stringify(favorites));
}

// Internal mutable state — triggers re-renders via the version counter
let currentFavorites: string[] = [];
let currentKey = '';

const versionAtom = atom(0);

export const tokenFavoritesAtom = atom((get) => {
	get(versionAtom); // subscribe to changes
	const normalizer = get(activeNormalizerAtom);
	const wallet = get(walletAddressAtom);
	const key = buildStorageKey(normalizer.name, wallet);

	if (key !== currentKey) {
		currentKey = key;
		currentFavorites = readFavorites(key);
	}

	return currentFavorites;
});

export const toggleFavoriteAtom = atom(null, (get, set, coin: string) => {
	const normalizer = get(activeNormalizerAtom);
	const wallet = get(walletAddressAtom);
	const key = buildStorageKey(normalizer.name, wallet);

	const current = readFavorites(key);
	const isFavorite = current.includes(coin);
	const updated = isFavorite
		? current.filter((favorite) => favorite !== coin)
		: [...current, coin];

	writeFavorites(key, updated);
	currentFavorites = updated;
	currentKey = key;
	set(versionAtom, (prev) => prev + 1); // trigger re-render
});
