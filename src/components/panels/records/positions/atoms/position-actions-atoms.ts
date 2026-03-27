import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface PositionActionData {
	coin: string;
	side: 'LONG' | 'SHORT';
	size: number;
	entryPrice: number;
	markPrice: number;
	leverage: string;
	type: 'limit' | 'market' | 'tpsl' | 'reverse';
	// Existing TP/SL order IDs (for cancel)
	tpOrderId?: number | null;
	slOrderId?: number | null;
	// Existing TP/SL prices
	tpPrice?: number | null;
	slPrice?: number | null;
}

// Which position action dialog is open (null = closed)
export const activePositionActionAtom = atom<PositionActionData | null>(null);

// "Don't show this again" for market close confirmation
export const skipMarketCloseConfirmAtom = atomWithStorage<boolean>(
	'skip-market-close-confirm',
	false,
);

// "Don't show this again" for reverse confirmation
export const skipReverseConfirmAtom = atomWithStorage<boolean>(
	'skip-reverse-confirm',
	false,
);

// Loading state for position actions
export const isClosingPositionAtom = atom<boolean>(false);
