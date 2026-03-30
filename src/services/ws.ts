import { TradingWebSocket } from './websocket';
import type { DexNormalizer } from '@/normalizer/normalizer';
import type { ProtocolHooks } from '@/normalizer/normalizer';

function buildProtocolHooks(normalizer: DexNormalizer): ProtocolHooks {
	return {
		channelKey: normalizer.channelKey,
		formatSubscribe: normalizer.formatSubscribe,
		formatUnsubscribe: normalizer.formatUnsubscribe,
		parseMessage: normalizer.parseWsMessage,
		deserialize: normalizer.deserialize,
		formatPing: normalizer.formatPing,
		isPong: normalizer.isPong,
	};
}

// Placeholder URL — reconfigured before first connect via configureDexWs()
export const tradingWs = new TradingWebSocket({
	url: 'wss://placeholder',
	protocol: {
		channelKey: () => '',
		formatSubscribe: () => ({}),
		formatUnsubscribe: () => ({}),
		parseMessage: () => null,
		deserialize: (data: unknown) => data,
		formatPing: () => ({}),
		isPong: () => false,
	},
});

/** Reconfigure the WS singleton for a new DEX. Call before connect(). */
export function configureDexWs(normalizer: DexNormalizer): void {
	tradingWs.reconfigure({
		url: normalizer.wsUrl,
		protocol: buildProtocolHooks(normalizer),
	});
}
