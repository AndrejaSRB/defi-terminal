import { useCallback, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
	panelLayoutsAtom,
	savePanelLayoutAtom,
} from '@/atoms/user/panel-layout';

export function useSavedLayout(groupId: string) {
	const layouts = useAtomValue(panelLayoutsAtom);
	const saveLayout = useSetAtom(savePanelLayoutAtom);

	const defaultLayout = useMemo(
		() => layouts[groupId] as { [id: string]: number } | undefined,
		[layouts, groupId],
	);

	const onLayoutChange = useCallback(
		(layout: { [id: string]: number }) => {
			saveLayout({ groupId, layout });
		},
		[groupId, saveLayout],
	);

	return { defaultLayout, onLayoutChange };
}
