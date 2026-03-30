import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCountdownOptions {
	/** Duration in seconds */
	duration: number;
	/** Called when countdown reaches 0 */
	onExpire: () => void;
	/** Start the countdown immediately */
	autoStart?: boolean;
}

export function useCountdown({
	duration,
	onExpire,
	autoStart = false,
}: UseCountdownOptions) {
	const [secondsLeft, setSecondsLeft] = useState(duration);
	const [isRunning, setIsRunning] = useState(autoStart);
	const onExpireRef = useRef(onExpire);
	onExpireRef.current = onExpire;

	const start = useCallback(() => {
		setSecondsLeft(duration);
		setIsRunning(true);
	}, [duration]);

	const stop = useCallback(() => {
		setIsRunning(false);
	}, []);

	const reset = useCallback(() => {
		setSecondsLeft(duration);
		setIsRunning(true);
	}, [duration]);

	useEffect(() => {
		if (!isRunning) return;

		const interval = setInterval(() => {
			setSecondsLeft((prev) => {
				if (prev <= 1) {
					onExpireRef.current();
					return duration; // auto-restart
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [isRunning, duration]);

	return { secondsLeft, isRunning, start, stop, reset };
}
