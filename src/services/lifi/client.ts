import { createConfig, EVM } from '@lifi/sdk';
import { LIFI_API_KEY, LIFI_APP_NAME } from './types';

let initialized = false;

export function ensureLifiSdk(): void {
	if (initialized) return;

	createConfig({
		integrator: LIFI_APP_NAME || 'terminal',
		apiKey: LIFI_API_KEY || undefined,
		providers: [EVM()],
	});

	initialized = true;
}
