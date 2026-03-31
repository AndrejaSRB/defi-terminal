export { TradingWebSocket } from './single-connection';
export type { WebSocketMetrics } from './single-connection';
export { MultiStreamWebSocket } from './multi-stream';
export type { MultiStreamConfig } from './multi-stream';
export { createWebSocket, buildProtocolHooks } from './factory';
export type {
	ConnectionState,
	DataCallback,
	StateListener,
	TradingWsClient,
	WebSocketConfig,
} from './shared';
