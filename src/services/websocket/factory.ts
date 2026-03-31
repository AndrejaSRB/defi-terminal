import type { DexNormalizer, ProtocolHooks } from '@/normalizer/normalizer';
import { TradingWebSocket } from './single-connection';
import { MultiStreamWebSocket } from './multi-stream';

export function buildProtocolHooks(normalizer: DexNormalizer): ProtocolHooks {
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

export function createWebSocket(
	normalizer: DexNormalizer,
): TradingWebSocket | MultiStreamWebSocket {
	const protocol = buildProtocolHooks(normalizer);

	if (normalizer.wsType === 'multi-stream') {
		return new MultiStreamWebSocket({
			url: normalizer.wsUrl,
			protocol,
			buildStreamUrl: normalizer.buildStreamUrl,
		});
	}

	return new TradingWebSocket({
		url: normalizer.wsUrl,
		protocol,
	});
}
