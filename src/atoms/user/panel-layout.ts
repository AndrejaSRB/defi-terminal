import { atom } from 'jotai';
import { walletAddressAtom } from './onboarding';

type Layout = { [id: string]: number };
type LayoutMap = Record<string, Layout>;

function buildStorageKey(wallet: string | null): string {
	return `panel-layout:${wallet ?? 'default'}`;
}

function readLayouts(key: string): LayoutMap {
	try {
		const stored = localStorage.getItem(key);
		return stored ? (JSON.parse(stored) as LayoutMap) : {};
	} catch {
		return {};
	}
}

function writeLayouts(key: string, layouts: LayoutMap): void {
	localStorage.setItem(key, JSON.stringify(layouts));
}

const versionAtom = atom(0);

export const panelLayoutsAtom = atom((get) => {
	get(versionAtom);
	const wallet = get(walletAddressAtom);
	return readLayouts(buildStorageKey(wallet));
});

export const savePanelLayoutAtom = atom(
	null,
	(get, set, payload: { groupId: string; layout: Layout }) => {
		const wallet = get(walletAddressAtom);
		const key = buildStorageKey(wallet);
		const layouts = readLayouts(key);
		layouts[payload.groupId] = payload.layout;
		writeLayouts(key, layouts);
		set(versionAtom, (prev) => prev + 1);
	},
);
