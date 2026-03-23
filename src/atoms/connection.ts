import { atom } from 'jotai';
import type { ConnectionState } from '@/services/websocket';

export const connectionStateAtom = atom<ConnectionState>('disconnected');
