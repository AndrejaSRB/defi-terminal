import type { ChannelDescriptor, ProtocolHooks } from '@/normalizer/normalizer';
import type {
	ConnectionState,
	DataCallback,
	StateListener,
	SubscribeOptions,
	WebSocketConfig,
} from './shared';

interface ConnectionConfig extends WebSocketConfig {
	maxReconnectAttempts?: number;
	heartbeatInterval?: number;
	pongTimeout?: number;
	hiddenThreshold?: number;
	maxSendQueueSize?: number;
	cacheEvictionDelay?: number;
}

const DEFAULTS = {
	maxReconnectAttempts: 10,
	heartbeatInterval: 10_000,
	pongTimeout: 5_000,
	hiddenThreshold: 30_000,
	maxSendQueueSize: 100,
	cacheEvictionDelay: 15_000,
} as const;

export interface WebSocketMetrics {
	connectedAt: number | null;
	reconnectCount: number;
	messagesReceived: number;
	lastMessageAt: number | null;
	errors: number;
	latency: number | null;
}

const CLOSE_CODES = {
	NORMAL: 1000,
	PONG_TIMEOUT: 4001,
} as const;

const isBrowser = typeof window !== 'undefined';

class TradingWebSocket {
	private ws: WebSocket | null = null;
	private config: Required<Omit<ConnectionConfig, 'protocol'>> &
		Pick<ConnectionConfig, 'protocol'>;
	private protocol: ProtocolHooks;
	private state: ConnectionState = 'disconnected';

	private connectLock = false;

	// Subscribers: channelKey → Set<callbacks>
	private subscribers = new Map<string, Set<DataCallback>>();
	private lastMessages = new Map<string, unknown>();
	private channelDescriptors = new Map<string, ChannelDescriptor>();

	// Per-channel reconnect callbacks for REST reconciliation
	private reconnectCallbacks = new Map<string, Set<() => void>>();
	private isReconnect = false;

	// Message buffering for snapshot+delta sync
	private buffers = new Map<string, unknown[]>();

	// Send queue — only for general data messages, NOT subscriptions or pings
	private sendQueue: string[] = [];

	// Reconnection
	private reconnectAttempt = 0;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

	// Heartbeat
	private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
	private pongTimer: ReturnType<typeof setTimeout> | null = null;
	private pingSentAt: number | null = null;

	// Visibility
	private hiddenSince: number | null = null;

	// Delayed cache eviction timers
	private cacheEvictionTimers = new Map<
		string,
		ReturnType<typeof setTimeout>
	>();

	// Request/response for post actions (order placement, cancel, etc.)
	private pendingRequests = new Map<
		number,
		{
			resolve: (value: unknown) => void;
			reject: (reason: Error) => void;
			timer: ReturnType<typeof setTimeout>;
		}
	>();
	private requestId = 0;

	// Connection state listeners
	private stateListeners = new Set<StateListener>();

	// Metrics
	private metrics: WebSocketMetrics = {
		connectedAt: null,
		reconnectCount: 0,
		messagesReceived: 0,
		lastMessageAt: null,
		errors: 0,
		latency: null,
	};

	constructor(config: ConnectionConfig) {
		this.config = { ...DEFAULTS, ...config };
		this.protocol = config.protocol;

		if (isBrowser) {
			this.setupBrowserListeners();
		}
	}

	// ── PUBLIC API ───────────────────────────────────────────────────

	connect() {
		if (!isBrowser) return;
		if (this.connectLock) return;
		if (this.ws?.readyState === WebSocket.OPEN) return;
		if (this.ws?.readyState === WebSocket.CONNECTING) return;

		this.connectLock = true;
		this.createConnection();
	}

	disconnect() {
		this.clearAllTimers();
		this.rejectAllPending();
		this.connectLock = false;
		this.isReconnect = false;

		if (this.ws) {
			this.ws.onopen = null;
			this.ws.onmessage = null;
			this.ws.onclose = null;
			this.ws.onerror = null;

			// Bug fix #5: check readyState before closing
			if (
				this.ws.readyState === WebSocket.OPEN ||
				this.ws.readyState === WebSocket.CONNECTING
			) {
				this.ws.close(CLOSE_CODES.NORMAL);
			}
			this.ws = null;
		}

		this.setState('disconnected');
	}

	/** Swap URL and protocol for a different DEX. Disconnects first if connected. */
	reconfigure(config: { url: string; protocol: ProtocolHooks }) {
		this.disconnect();
		this.config = { ...this.config, ...config };
		this.protocol = config.protocol;
		this.subscribers.clear();
		this.lastMessages.clear();
		this.channelDescriptors.clear();
		this.reconnectCallbacks.clear();
		this.buffers.clear();
		this.sendQueue = [];
		this.reconnectAttempt = 0;
		this.isReconnect = false;
	}

	/**
	 * Send a general data message (e.g. place order).
	 * Queued if not connected. Subscriptions and pings bypass this.
	 */
	send(data: Record<string, unknown>) {
		const message = JSON.stringify(data);

		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(message);
		} else {
			if (this.sendQueue.length >= this.config.maxSendQueueSize) {
				this.sendQueue.shift();
			}
			this.sendQueue.push(message);
		}
	}

	/**
	 * Send an action via WS and wait for the response.
	 * Used for order placement, cancellation, leverage updates, etc.
	 * Rejects on timeout (10s) or disconnect.
	 */
	postAction(payload: unknown): Promise<unknown> {
		return new Promise((resolve, reject) => {
			if (this.ws?.readyState !== WebSocket.OPEN) {
				reject(new Error('WebSocket not connected'));
				return;
			}

			const id = ++this.requestId;
			const timer = setTimeout(() => {
				this.pendingRequests.delete(id);
				reject(new Error('Request timed out'));
			}, 10_000);

			this.pendingRequests.set(id, { resolve, reject, timer });

			this.ws.send(
				JSON.stringify({
					method: 'post',
					id,
					request: { type: 'action', payload },
				}),
			);
		});
	}

	subscribe(
		descriptor: ChannelDescriptor,
		callback: DataCallback,
		options?: SubscribeOptions,
	): () => void {
		const key = this.protocol.channelKey(descriptor);

		// Cancel any pending cache eviction for this channel
		const evictionTimer = this.cacheEvictionTimers.get(key);
		if (evictionTimer) {
			clearTimeout(evictionTimer);
			this.cacheEvictionTimers.delete(key);
		}

		if (!this.subscribers.has(key)) {
			this.subscribers.set(key, new Set());
			this.channelDescriptors.set(key, descriptor);
			// Bug fix #4: send subscription directly, bypass queue
			this.sendDirect(this.protocol.formatSubscribe(descriptor));
		}

		this.subscribers.get(key)!.add(callback);

		// Store reconnect callback for REST reconciliation
		if (options?.onReconnect) {
			if (!this.reconnectCallbacks.has(key)) {
				this.reconnectCallbacks.set(key, new Set());
			}
			this.reconnectCallbacks.get(key)!.add(options.onReconnect);
		}

		// Replay cached value so component doesn't flash loading
		const cached = this.lastMessages.get(key);
		if (cached !== undefined) {
			queueMicrotask(() => callback(cached));
		}

		const onReconnectRef = options?.onReconnect;
		return () => this.unsubscribe(key, callback, onReconnectRef);
	}

	// ── Buffering API (snapshot+delta sync) ──────────────────────────

	startBuffering(descriptor: ChannelDescriptor) {
		this.buffers.set(this.protocol.channelKey(descriptor), []);
	}

	flushBuffer(descriptor: ChannelDescriptor): unknown[] {
		const key = this.protocol.channelKey(descriptor);
		const buffer = this.buffers.get(key) || [];
		this.buffers.delete(key);
		return buffer;
	}

	isBuffering(descriptor: ChannelDescriptor): boolean {
		return this.buffers.has(this.protocol.channelKey(descriptor));
	}

	// ── State & Cache API ────────────────────────────────────────────

	onStateChange(listener: StateListener): () => void {
		this.stateListeners.add(listener);
		listener(this.state);
		return () => this.stateListeners.delete(listener);
	}

	getState(): ConnectionState {
		return this.state;
	}

	getLastMessage<T = unknown>(descriptor: ChannelDescriptor): T | undefined {
		return this.lastMessages.get(this.protocol.channelKey(descriptor)) as
			| T
			| undefined;
	}

	clearCache(descriptor?: ChannelDescriptor) {
		if (descriptor) {
			this.lastMessages.delete(this.protocol.channelKey(descriptor));
		} else {
			this.lastMessages.clear();
		}
	}

	// ── Metrics API ──────────────────────────────────────────────────

	getMetrics(): Readonly<WebSocketMetrics> {
		return { ...this.metrics };
	}

	resetMetrics() {
		this.metrics = {
			connectedAt: null,
			reconnectCount: 0,
			messagesReceived: 0,
			lastMessageAt: null,
			errors: 0,
			latency: null,
		};
	}

	// ── Protocol swap (for switching DEX at runtime) ─────────────────

	updateProtocol(protocol: ProtocolHooks) {
		const wasConnected = this.ws?.readyState === WebSocket.OPEN;

		// Unsubscribe all with old protocol
		if (wasConnected) {
			for (const descriptor of this.channelDescriptors.values()) {
				this.sendDirect(this.protocol.formatUnsubscribe(descriptor));
			}
		}

		this.protocol = protocol;

		// Resubscribe all with new protocol
		if (wasConnected) {
			for (const descriptor of this.channelDescriptors.values()) {
				this.sendDirect(this.protocol.formatSubscribe(descriptor));
			}
		}
	}

	// ── Lifecycle ────────────────────────────────────────────────────

	destroy() {
		this.disconnect();
		if (isBrowser) {
			this.removeBrowserListeners();
		}
		this.subscribers.clear();
		this.channelDescriptors.clear();
		this.reconnectCallbacks.clear();
		this.lastMessages.clear();
		this.buffers.clear();
		this.stateListeners.clear();
		this.sendQueue = [];
		this.rejectAllPending();

		for (const timer of this.cacheEvictionTimers.values()) {
			clearTimeout(timer);
		}
		this.cacheEvictionTimers.clear();
	}

	// ── PRIVATE: Subscription Management ─────────────────────────────

	private unsubscribe(
		key: string,
		callback: DataCallback,
		onReconnect?: () => void,
	) {
		const callbacks = this.subscribers.get(key);
		if (!callbacks) return;

		callbacks.delete(callback);

		// Clean up this specific reconnect callback
		if (onReconnect) {
			const reconnectSet = this.reconnectCallbacks.get(key);
			if (reconnectSet) {
				reconnectSet.delete(onReconnect);
				if (reconnectSet.size === 0) {
					this.reconnectCallbacks.delete(key);
				}
			}
		}

		if (callbacks.size === 0) {
			this.subscribers.delete(key);
			this.reconnectCallbacks.delete(key);
			this.buffers.delete(key);

			const descriptor = this.channelDescriptors.get(key);
			this.channelDescriptors.delete(key);

			if (descriptor) {
				// Bug fix #4: unsubscribe directly, bypass queue
				this.sendDirect(this.protocol.formatUnsubscribe(descriptor));
			}

			// Bug fix #6: delayed cache eviction instead of immediate delete
			this.cacheEvictionTimers.set(
				key,
				setTimeout(() => {
					// Only evict if no one re-subscribed during the delay
					if (!this.subscribers.has(key)) {
						this.lastMessages.delete(key);
					}
					this.cacheEvictionTimers.delete(key);
				}, this.config.cacheEvictionDelay),
			);
		}
	}

	/**
	 * Send directly on the WebSocket — bypasses the queue.
	 * Used for subscriptions, unsubscriptions, and pings.
	 */
	private sendDirect(data: object) {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(data));
		}
	}

	// ── PRIVATE: Connection ──────────────────────────────────────────

	private createConnection() {
		this.setState('connecting');

		// Bug fix #1: catch construction failures so connectLock isn't stuck
		let ws: WebSocket;
		try {
			ws = new WebSocket(this.config.url);
		} catch (e) {
			console.error('[TradingWS] Failed to create WebSocket:', e);
			this.connectLock = false;
			this.metrics.errors++;
			this.scheduleReconnect();
			return;
		}

		this.ws = ws;

		ws.onopen = () => {
			const wasReconnect = this.isReconnect;
			this.isReconnect = false;

			this.connectLock = false;
			this.reconnectAttempt = 0;
			this.metrics.connectedAt = Date.now();
			this.setState('connected');

			// Resubscribe all active channels
			for (const descriptor of this.channelDescriptors.values()) {
				this.sendDirect(this.protocol.formatSubscribe(descriptor));
			}

			// Fire per-channel reconnect callbacks for REST reconciliation
			if (wasReconnect) {
				for (const callbackSet of this.reconnectCallbacks.values()) {
					for (const cb of callbackSet) {
						try {
							cb();
						} catch (e) {
							console.error('[TradingWS] Reconnect callback error:', e);
						}
					}
				}
			}

			this.flushSendQueue();
			this.startHeartbeat();
		};

		ws.onmessage = (event) => {
			try {
				const message = this.protocol.deserialize(event.data);
				this.handleMessage(message);
			} catch (e) {
				console.error('[TradingWS] Failed to deserialize message:', e);
				this.metrics.errors++;
			}
		};

		ws.onclose = (event) => {
			this.connectLock = false;
			this.stopHeartbeat();
			this.handleClose(event);
		};

		ws.onerror = (error) => {
			console.error('[TradingWS] Error:', error);
			this.metrics.errors++;
		};
	}

	// ── PRIVATE: Message Handling ────────────────────────────────────

	private handleMessage(message: unknown) {
		// Handle post action responses (order placement, cancel, etc.)
		if (this.handlePostResponse(message)) return;

		// Handle pong — measure latency
		if (this.protocol.isPong(message)) {
			this.clearPongTimeout();
			if (this.pingSentAt) {
				this.metrics.latency = Date.now() - this.pingSentAt;
				this.pingSentAt = null;
			}
			return;
		}

		const parsed = this.protocol.parseMessage(message);
		if (!parsed) return;

		const { channel, payload } = parsed;

		this.metrics.messagesReceived++;
		this.metrics.lastMessageAt = Date.now();

		// If buffering, collect instead of dispatching
		const buffer = this.buffers.get(channel);
		if (buffer) {
			buffer.push(payload);
			return;
		}

		// Cache latest value
		this.lastMessages.set(channel, payload);

		// Route to subscribers
		const callbacks = this.subscribers.get(channel);
		if (callbacks) {
			for (const cb of callbacks) {
				try {
					cb(payload);
				} catch (e) {
					console.error(`[TradingWS] Subscriber error on ${channel}:`, e);
				}
			}
		}
	}

	private handlePostResponse(message: unknown): boolean {
		const msg = message as Record<string, unknown>;
		if (msg.channel !== 'post') return false;

		const data = msg.data as
			| {
					id?: number;
					response?: { payload?: { status?: string; response?: unknown } };
			  }
			| undefined;
		if (!data?.id) return false;

		const pending = this.pendingRequests.get(data.id);
		if (!pending) return false;

		clearTimeout(pending.timer);
		this.pendingRequests.delete(data.id);

		const payload = data.response?.payload;
		if (payload?.status === 'ok') {
			pending.resolve(payload.response);
		} else {
			const errorMsg =
				typeof payload?.response === 'string'
					? payload.response
					: 'Request failed';
			pending.reject(new Error(errorMsg));
		}
		return true;
	}

	private rejectAllPending() {
		for (const [id, pending] of this.pendingRequests) {
			clearTimeout(pending.timer);
			pending.reject(new Error('Connection lost'));
			this.pendingRequests.delete(id);
		}
	}

	private handleClose(event: CloseEvent) {
		this.rejectAllPending();

		switch (event.code) {
			case 1000:
				this.isReconnect = false;
				this.setState('disconnected');
				break;

			case 1001:
			case 1006:
			case 1012:
			case 1013:
			case 1014:
			case CLOSE_CODES.PONG_TIMEOUT:
				this.scheduleReconnect();
				break;

			case 1008:
				console.error('[TradingWS] Policy violation (auth?), not reconnecting');
				this.setState('disconnected');
				break;

			case 4000:
				console.warn(
					'[TradingWS] Rate limited, reconnecting with longer delay',
				);
				this.reconnectAttempt = Math.max(this.reconnectAttempt, 3);
				this.scheduleReconnect();
				break;

			default:
				this.scheduleReconnect();
		}
	}

	// ── PRIVATE: Reconnection ────────────────────────────────────────

	private scheduleReconnect() {
		if (this.reconnectAttempt >= this.config.maxReconnectAttempts) {
			console.error('[TradingWS] Max reconnection attempts reached');
			this.setState('disconnected');
			return;
		}

		if (isBrowser && !navigator.onLine) {
			this.setState('disconnected');
			return;
		}

		this.isReconnect = true;
		this.setState('reconnecting');
		this.metrics.reconnectCount++;

		const delay = this.getBackoffDelay(this.reconnectAttempt);
		this.reconnectAttempt++;

		this.reconnectTimer = setTimeout(() => this.connect(), delay);
	}

	private getBackoffDelay(attempt: number): number {
		const base = Math.min(1000 * 2 ** attempt, 30_000);
		const jitter = Math.random() * base * 0.5;
		return base + jitter;
	}

	// ── PRIVATE: Heartbeat ───────────────────────────────────────────

	private startHeartbeat() {
		this.stopHeartbeat();

		this.heartbeatTimer = setInterval(() => {
			// Bug fix #2: send ping directly, never queue
			if (this.ws?.readyState === WebSocket.OPEN) {
				this.pingSentAt = Date.now();
				this.ws.send(JSON.stringify(this.protocol.formatPing()));
				this.setPongTimeout();
			}
		}, this.config.heartbeatInterval);
	}

	private stopHeartbeat() {
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
		this.clearPongTimeout();
	}

	private setPongTimeout() {
		this.clearPongTimeout();
		this.pongTimer = setTimeout(() => {
			console.warn('[TradingWS] Pong timeout, closing connection');
			// Bug fix #5: check readyState before closing
			if (this.ws?.readyState === WebSocket.OPEN) {
				this.ws.close(CLOSE_CODES.PONG_TIMEOUT, 'pong timeout');
			}
		}, this.config.pongTimeout);
	}

	private clearPongTimeout() {
		if (this.pongTimer) {
			clearTimeout(this.pongTimer);
			this.pongTimer = null;
		}
	}

	// ── PRIVATE: Browser Lifecycle ───────────────────────────────────

	private handleOnline = () => {
		this.reconnectAttempt = 0;
		// Clear any stale reconnect timers from before offline
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		if (this.ws?.readyState !== WebSocket.OPEN) {
			this.isReconnect = true;
			this.connect();
		}
	};

	private handleOffline = () => {
		this.clearAllTimers();
		this.rejectAllPending();
		this.connectLock = false;
		this.reconnectAttempt = 0;
		if (this.ws) {
			this.ws.onopen = null;
			this.ws.onmessage = null;
			this.ws.onclose = null;
			this.ws.onerror = null;
			if (
				this.ws.readyState === WebSocket.OPEN ||
				this.ws.readyState === WebSocket.CONNECTING
			) {
				this.ws.close(CLOSE_CODES.NORMAL);
			}
			this.ws = null;
		}
		this.setState('disconnected');
	};

	// Bug fix #3: only reconnect if actually stale, not on every tab focus
	private handleVisibilityChange = () => {
		if (document.visibilityState === 'hidden') {
			this.hiddenSince = Date.now();
			this.stopHeartbeat();
		} else {
			const hiddenDuration = this.hiddenSince
				? Date.now() - this.hiddenSince
				: 0;
			this.hiddenSince = null;

			if (this.ws?.readyState === WebSocket.OPEN) {
				// Socket still open — just restart heartbeat
				this.startHeartbeat();
			} else if (hiddenDuration > this.config.hiddenThreshold) {
				// Was hidden long enough that connection is likely stale
				this.disconnect();
				this.reconnectAttempt = 0;
				this.isReconnect = true;
				this.connect();
			} else {
				// Short hide, socket not open — it's probably already reconnecting
				if (this.state === 'disconnected') {
					this.reconnectAttempt = 0;
					this.isReconnect = true;
					this.connect();
				}
			}
		}
	};

	private setupBrowserListeners() {
		window.addEventListener('online', this.handleOnline);
		window.addEventListener('offline', this.handleOffline);
		document.addEventListener('visibilitychange', this.handleVisibilityChange);
	}

	private removeBrowserListeners() {
		window.removeEventListener('online', this.handleOnline);
		window.removeEventListener('offline', this.handleOffline);
		document.removeEventListener(
			'visibilitychange',
			this.handleVisibilityChange,
		);
	}

	// ── PRIVATE: State Machine ───────────────────────────────────────

	private setState(newState: ConnectionState) {
		if (this.state === newState) return;
		this.state = newState;
		for (const listener of this.stateListeners) {
			listener(newState);
		}
	}

	// ── PRIVATE: Send Queue ──────────────────────────────────────────

	private flushSendQueue() {
		if (this.ws?.readyState !== WebSocket.OPEN) return;

		while (this.sendQueue.length > 0) {
			const message = this.sendQueue.shift()!;
			this.ws.send(message);
		}
	}

	// ── PRIVATE: Timer Cleanup ───────────────────────────────────────

	private clearAllTimers() {
		this.stopHeartbeat();
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
	}
}

export { TradingWebSocket, CLOSE_CODES };
export type { ConnectionConfig, ConnectionState, ProtocolHooks, StateListener };
