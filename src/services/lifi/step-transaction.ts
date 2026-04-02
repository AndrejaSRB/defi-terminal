import { getStepTransaction } from '@lifi/sdk';
import type { LiFiStep } from '@lifi/sdk';

/**
 * Fetches the transaction data for a specific route step.
 * Must be called right before execution — tx data expires quickly.
 */
export async function fetchStepTransaction(step: LiFiStep): Promise<LiFiStep> {
	return getStepTransaction(step);
}
