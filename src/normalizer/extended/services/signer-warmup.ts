/**
 * Warmup utility for the Extended signer service.
 *
 * Render free tier sleeps after 15 min of inactivity.
 * Call warmup() when the withdraw/order dialog opens to wake it.
 */

import { SIGNER_URL } from './signer-config';

let lastWarmup = 0;
const WARMUP_COOLDOWN = 60_000; // Don't warmup more than once per minute

export function warmupSigner(): void {
	const now = Date.now();
	if (now - lastWarmup < WARMUP_COOLDOWN) return;
	lastWarmup = now;

	// Fire and forget — just wake the service
	fetch(`${SIGNER_URL}/health`).catch(() => {});
}
