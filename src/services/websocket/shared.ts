import type { ChannelDescriptor, ProtocolHooks } from '@/normalizer/normalizer';

// ── Connection State ──

export type ConnectionState =
	| 'disconnected'
	| 'connecting'
	| 'connected'
	| 'reconnecting';

// ── Callbacks ──

export type DataCallback = (data: unknown) => void;
export type StateListener = (state: ConnectionState) => void;

// ── Subscribe Options ──

export interface SubscribeOptions {
	/** Called after reconnect + resubscription. Use for REST snapshot reconciliation. */
	onReconnect?: () => void;
}

// ── Client Interface ──
// Minimal contract for consumers (hooks, datafeed, etc.)

export interface TradingWsClient {
	subscribe(
		descriptor: ChannelDescriptor,
		callback: DataCallback,
		options?: SubscribeOptions,
	): () => void;
	connect(): void;
	disconnect(): void;
	onStateChange(listener: StateListener): () => void;
	getState(): ConnectionState;
	startBuffering(descriptor: ChannelDescriptor): void;
	flushBuffer(descriptor: ChannelDescriptor): unknown[];
}

// ── Config ──

export interface WebSocketConfig {
	url: string;
	protocol: ProtocolHooks;
}
