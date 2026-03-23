import { TradingWebSocket } from './websocket';
import { hyperliquidNormalizer } from '@/normalizer/hyperliquid/hyperliquid';
import type { DexNormalizer } from '@/normalizer/normalizer';
import type { ProtocolHooks } from '@/normalizer/normalizer';

const HL_WS_URL = 'wss://api.hyperliquid.xyz/ws';

function buildProtocolHooks(normalizer: DexNormalizer): ProtocolHooks {
	return {
		channelKey: normalizer.channelKey,
		formatSubscribe: normalizer.formatSubscribe,
		formatUnsubscribe: normalizer.formatUnsubscribe,
		parseMessage: normalizer.parseWsMessage,
		deserialize: (data: unknown) =>
			typeof data === 'string' ? JSON.parse(data) : data,
		formatPing: () => ({ method: 'ping' }),
		isPong: (message: unknown) =>
			typeof message === 'object' &&
			message !== null &&
			(message as { channel?: string }).channel === 'pong',
	};
}

const activeNormalizer: DexNormalizer = hyperliquidNormalizer;

export const tradingWs = new TradingWebSocket({
	url: HL_WS_URL,
	protocol: buildProtocolHooks(activeNormalizer),
});

export function getActiveNormalizer(): DexNormalizer {
	return activeNormalizer;
}
