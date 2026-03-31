import { atom } from 'jotai';

type Layout = { [id: string]: number };
type LayoutMap = Record<string, Layout>;

const STORAGE_KEY = 'panel-layout';

function readLayouts(): LayoutMap {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? (JSON.parse(stored) as LayoutMap) : {};
	} catch {
		return {};
	}
}

function writeLayouts(layouts: LayoutMap): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
}

const versionAtom = atom(0);

export const panelLayoutsAtom = atom((get) => {
	get(versionAtom);
	return readLayouts();
});

export const savePanelLayoutAtom = atom(
	null,
	(_get, set, payload: { groupId: string; layout: Layout }) => {
		const layouts = readLayouts();
		layouts[payload.groupId] = payload.layout;
		writeLayouts(layouts);
		set(versionAtom, (prev) => prev + 1);
	},
);

export const resetPanelLayoutAtom = atom(null, (_get, set) => {
	localStorage.removeItem(STORAGE_KEY);
	set(versionAtom, (prev) => prev + 1);
});
