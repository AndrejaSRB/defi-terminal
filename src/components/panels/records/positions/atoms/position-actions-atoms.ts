import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface PositionActionData {
	coin: string;
	side: 'LONG' | 'SHORT';
	size: number;
	entryPrice: number;
	type: 'limit' | 'market';
}

// Which position action dialog is open (null = closed)
export const activePositionActionAtom = atom<PositionActionData | null>(null);

// "Don't show this again" for market close confirmation
export const skipMarketCloseConfirmAtom = atomWithStorage<boolean>(
	'skip-market-close-confirm',
	false,
);

// Loading state for position actions
export const isClosingPositionAtom = atom<boolean>(false);
