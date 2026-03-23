import { useCallback, useState } from 'react';

export function useTokenHeaderExpand() {
	const [isExpanded, setIsExpanded] = useState(false);
	const toggle = useCallback(() => setIsExpanded((prev) => !prev), []);
	return { isExpanded, toggle };
}
