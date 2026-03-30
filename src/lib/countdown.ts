export function formatCountdown(seconds: number): string {
	if (seconds < 0) return '00:00';

	if (seconds < 3600) {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;

	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/** Seconds until the next UTC hour (HL funding happens every hour) */
export function calculateFundingCountdown(): number {
	const now = new Date();
	const currentMinute = now.getUTCMinutes();
	const currentSecond = now.getUTCSeconds();
	return 3600 - (currentMinute * 60 + currentSecond);
}
