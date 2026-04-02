import { atom } from 'jotai';

/** Active tab in the records panel — triggers data refetch on change */
export const activeRecordsTabAtom = atom('positions');
