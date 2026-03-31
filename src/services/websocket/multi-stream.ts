import type { ChannelDescriptor, ProtocolHooks } from '@/normalizer/normalizer';
import type {
	ConnectionState,
	DataCallback,
	StateListener,
	WebSocketConfig,
} from './shared';

const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export interface MultiStreamConfig extends WebSocketConfig {
	buildStreamUrl?: (baseUrl: string, descriptor: ChannelDescriptor) => string;
}

/**
 * MultiStreamWebSocket — manages N WebSocket connections (1 per channel).
 * Subscribe opens a connection. Unsubscribe closes it.
 * Used by DEXes with per-stream WS endpoints (Extended).
 */
export class MultiStreamWebSocket {
	private baseUrl = '';
	private protocol: ProtocolHooks | null = null;
	private buildStreamUrl:
		| ((baseUrl: string, descriptor: ChannelDescriptor) => string)
		| null = null;

	// Subscriber state — persists across connect/disconnect
	private subscribers = new Map<string, Set<DataCallback>>();
	private descriptors = new Map<string, ChannelDescriptor>();

	// Connection state — cleared on disconnect
	private connections = new Map<string, WebSocket>();
	private reconnectAttempts = new Map<string, number>();
	private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

	// Buffering — used by chart for gap-fill during REST fetch
	private bufferingChannels = new Set<string>();
	private buffers = new Map<string, unknown[]>();

	private stateListeners = new Set<StateListener>();
	private state: ConnectionState = 'disconnected';
	private active = false;

	constructor(config?: MultiStreamConfig) {
		if (config) {
			this.baseUrl = config.url;
			this.protocol = config.protocol;
			this.buildStreamUrl = config.buildStreamUrl ?? defaultBuildStreamUrl;
		}
	}

	subscribe(descriptor: ChannelDescriptor, callback: DataCallback): () => void {
		if (!this.protocol) return () => {};

		const key = this.protocol.channelKey(descriptor);

		// Store descriptor for reconnection
		this.descriptors.set(key, descriptor);

		// Add subscriber
		let subs = this.subscribers.get(key);
		if (!subs) {
			subs = new Set();
			this.subscribers.set(key, subs);
		}
		subs.add(callback);

		// Open stream if active and first subscriber
		if (subs.size === 1 && this.active) {
			this.openStream(key);
		}

		return () => {
			const currentSubs = this.subscribers.get(key);
			if (currentSubs) {
				currentSubs.delete(callback);
				if (currentSubs.size === 0) {
					this.subscribers.delete(key);
					this.descriptors.delete(key);
					this.closeStream(key);
				}
			}
		};
	}

	connect(): void {
		this.active = true;
		this.setState('connecting');

		// Open streams for all existing subscribers
		for (const key of this.subscribers.keys()) {
			if (!this.connections.has(key)) {
				this.openStream(key);
			}
		}
	}

	disconnect(): void {
		this.active = false;

		// Clear all reconnect timers
		for (const timer of this.reconnectTimers.values()) {
			clearTimeout(timer);
		}
		this.reconnectTimers.clear();
		this.reconnectAttempts.clear();

		// Close all connections
		for (const ws of this.connections.values()) {
			if (
				ws.readyState === WebSocket.OPEN ||
				ws.readyState === WebSocket.CONNECTING
			) {
				ws.close(1000);
			}
		}
		this.connections.clear();

		this.setState('disconnected');
	}

	reconfigure(config: MultiStreamConfig): void {
		this.disconnect();
		this.baseUrl = config.url;
		this.protocol = config.protocol;
		this.buildStreamUrl = config.buildStreamUrl ?? defaultBuildStreamUrl;
		this.subscribers.clear();
		this.descriptors.clear();
	}

	onStateChange(listener: StateListener): () => void {
		this.stateListeners.add(listener);
		return () => this.stateListeners.delete(listener);
	}

	getState(): ConnectionState {
		return this.state;
	}

	startBuffering(descriptor: ChannelDescriptor): void {
		if (!this.protocol) return;
		const key = this.protocol.channelKey(descriptor);
		this.bufferingChannels.add(key);
		this.buffers.set(key, []);
	}

	flushBuffer(descriptor: ChannelDescriptor): unknown[] {
		if (!this.protocol) return [];
		const key = this.protocol.channelKey(descriptor);
		this.bufferingChannels.delete(key);
		const buffered = this.buffers.get(key) ?? [];
		this.buffers.delete(key);
		return buffered;
	}

	// ── Internal ──

	private openStream(channelKey: string): void {
		if (!this.protocol || !this.buildStreamUrl) return;
		if (this.connections.has(channelKey)) return;

		const descriptor = this.descriptors.get(channelKey);
		if (!descriptor) return;

		const url = this.buildStreamUrl(this.baseUrl, descriptor);

		try {
			const ws = new WebSocket(url);
			this.connections.set(channelKey, ws);

			ws.onopen = () => {
				this.reconnectAttempts.set(channelKey, 0);
				this.updateState();
			};

			ws.onmessage = (event) => {
				if (!this.protocol) return;

				const raw = this.protocol.deserialize(event.data);

				// Handle pong
				if (this.protocol.isPong(raw)) return;

				// Try to parse through protocol
				const parsed = this.protocol.parseMessage(raw);
				const deliveryKey = parsed?.channel ?? channelKey;
				const payload = parsed?.payload ?? raw;

				// Buffer if channel is in buffering mode (chart gap-fill)
				if (this.bufferingChannels.has(deliveryKey)) {
					const buffer = this.buffers.get(deliveryKey);
					if (buffer) buffer.push(payload);
					return;
				}

				const subs = this.subscribers.get(deliveryKey);
				if (subs) {
					for (const callback of subs) callback(payload);
				}
			};

			ws.onclose = () => {
				this.connections.delete(channelKey);
				this.updateState();

				// Reconnect if still active and subscribed
				const attempts = this.reconnectAttempts.get(channelKey) ?? 0;
				if (
					this.active &&
					this.subscribers.has(channelKey) &&
					attempts < MAX_RECONNECT_ATTEMPTS
				) {
					this.reconnectAttempts.set(channelKey, attempts + 1);
					const timer = setTimeout(
						() => {
							this.reconnectTimers.delete(channelKey);
							if (this.active && this.subscribers.has(channelKey)) {
								this.openStream(channelKey);
							}
						},
						RECONNECT_DELAY * (attempts + 1),
					);
					this.reconnectTimers.set(channelKey, timer);
				}
			};

			ws.onerror = (error) => {
				console.warn(`[MultiStreamWS] Error on ${channelKey}:`, error);
			};
		} catch (error) {
			console.error(`[MultiStreamWS] Failed to open ${channelKey}:`, error);
		}
	}

	private closeStream(channelKey: string): void {
		// Cancel reconnection
		const timer = this.reconnectTimers.get(channelKey);
		if (timer) {
			clearTimeout(timer);
			this.reconnectTimers.delete(channelKey);
		}
		this.reconnectAttempts.delete(channelKey);

		// Close connection
		const ws = this.connections.get(channelKey);
		if (ws) {
			if (
				ws.readyState === WebSocket.OPEN ||
				ws.readyState === WebSocket.CONNECTING
			) {
				ws.close(1000);
			}
			this.connections.delete(channelKey);
		}

		this.updateState();
	}

	private setState(newState: ConnectionState): void {
		if (this.state === newState) return;
		this.state = newState;
		for (const listener of this.stateListeners) listener(newState);
	}

	private updateState(): void {
		if (!this.active) {
			this.setState('disconnected');
			return;
		}

		const hasOpen = Array.from(this.connections.values()).some(
			(ws) => ws.readyState === WebSocket.OPEN,
		);

		this.setState(hasOpen ? 'connected' : 'connecting');
	}
}

function defaultBuildStreamUrl(
	baseUrl: string,
	descriptor: ChannelDescriptor,
): string {
	return `${baseUrl}/${descriptor.type}`;
}
