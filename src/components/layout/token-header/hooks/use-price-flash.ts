import { useEffect, useRef, useCallback } from 'react';

export function usePriceFlash(price: number) {
	const ref = useRef<HTMLSpanElement>(null);
	const prevPrice = useRef(price);

	const onAnimationEnd = useCallback(() => {
		ref.current?.classList.remove('flash-up', 'flash-down');
	}, []);

	useEffect(() => {
		const el = ref.current;
		if (!el || price === 0) return;

		if (price > prevPrice.current) {
			el.classList.remove('flash-up', 'flash-down');
			void el.offsetWidth;
			el.classList.add('flash-up');
		} else if (price < prevPrice.current) {
			el.classList.remove('flash-up', 'flash-down');
			void el.offsetWidth;
			el.classList.add('flash-down');
		}

		prevPrice.current = price;
	}, [price]);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		el.addEventListener('animationend', onAnimationEnd);
		return () => el.removeEventListener('animationend', onAnimationEnd);
	}, [onAnimationEnd]);

	return ref;
}
