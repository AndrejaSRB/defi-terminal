import type { ChannelDescriptor, DexNormalizer } from '@/normalizer/normalizer';
import type {
	ConnectionState,
	DataCallback,
	StateListener,
	TradingWsClient,
} from './websocket/shared';
import { createWebSocket, buildProtocolHooks } from './websocket/factory';
import { TradingWebSocket } from './websocket';

// ── Active WS Instance ──

let activeWs: TradingWebSocket | ReturnType<typeof createWebSocket> =
	new TradingWebSocket({
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

// ── Proxy ──
// Hooks import this object. It delegates to whatever activeWs is.

export const tradingWs: TradingWsClient = {
	subscribe(descriptor: ChannelDescriptor, callback: DataCallback): () => void {
		return activeWs.subscribe(descriptor, callback);
	},

	connect(): void {
		activeWs.connect();
	},

	disconnect(): void {
		activeWs.disconnect();
	},

	onStateChange(listener: StateListener): () => void {
		return activeWs.onStateChange(listener);
	},

	getState(): ConnectionState {
		return activeWs.getState() as ConnectionState;
	},

	// Chart-specific — buffering during gap-fill REST fetch
	startBuffering(descriptor: ChannelDescriptor): void {
		activeWs.startBuffering(descriptor);
	},

	flushBuffer(descriptor: ChannelDescriptor): unknown[] {
		return activeWs.flushBuffer(descriptor);
	},
};

// ── Configure ──

export function configureDexWs(normalizer: DexNormalizer): void {
	// Disconnect current
	activeWs.disconnect();

	if (normalizer.wsType === 'multi-stream') {
		// Create new MultiStreamWebSocket
		activeWs = createWebSocket(normalizer);
	} else {
		// Reconfigure existing SingleConnection if possible, or create new
		if (activeWs instanceof TradingWebSocket) {
			activeWs.reconfigure({
				url: normalizer.wsUrl,
				protocol: buildProtocolHooks(normalizer),
			});
		} else {
			activeWs = createWebSocket(normalizer);
		}
	}
}
