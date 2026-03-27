import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { themeAtom, applyTheme, clearThemeOverrides } from '@/atoms/settings';

export function useTheme(): void {
	const themeId = useAtomValue(themeAtom);

	useEffect(() => {
		if (themeId === 'midnight') {
			clearThemeOverrides();
		} else {
			applyTheme(themeId);
		}
	}, [themeId]);
}
