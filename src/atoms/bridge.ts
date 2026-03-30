import { atom } from 'jotai';
import type { ExecutionStep } from '@/components/panels/deposit/types';

// ── Granular Bridge Atoms ──

export type BridgeStatus = 'idle' | 'executing' | 'success' | 'failed';

export const bridgeStatusAtom = atom<BridgeStatus>('idle');
export const bridgeStepsAtom = atom<ExecutionStep[]>([]);
export const bridgeTxHashAtom = atom<string | null>(null);
export const bridgeTokenSymbolAtom = atom<string>('');
export const bridgeDestChainNameAtom = atom<string>('');

// ── Reset Action ──

export const resetBridgeAtom = atom(null, (_get, set) => {
	set(bridgeStatusAtom, 'idle');
	set(bridgeStepsAtom, []);
	set(bridgeTxHashAtom, null);
	set(bridgeTokenSymbolAtom, '');
	set(bridgeDestChainNameAtom, '');
});
