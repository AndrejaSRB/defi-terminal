# WebSocket Design

## Protocol-Agnostic Client

The WS client (`TradingWebSocket`) is a singleton that manages one persistent connection. It handles connection lifecycle, heartbeat, reconnection, message routing, and caching - but knows nothing about the protocol being spoken.

The normalizer plugs in via `ProtocolHooks`:

| Hook                                    | Purpose                                        |
| --------------------------------------- | ---------------------------------------------- |
| `channelKey`                            | Route incoming messages to correct subscribers |
| `formatSubscribe` / `formatUnsubscribe` | Build protocol-specific subscription messages  |
| `parseMessage`                          | Extract channel + payload from raw WS messages |
| `formatPing` / `isPong`                 | Heartbeat protocol                             |
| `deserialize`                           | Parse raw message data (JSON, etc.)            |

## Client Types

| Type                   | Pattern                                 | Used By     |
| ---------------------- | --------------------------------------- | ----------- |
| `TradingWebSocket`     | Single socket, all channels multiplexed | HyperLiquid |
| `MultiStreamWebSocket` | One socket per channel                  | Extended    |

Both implement `TradingWsClient` interface. A proxy (`tradingWs` in `ws.ts`) delegates to whichever is active. Hooks import the proxy, never the client directly.

## Connection Management

- **Heartbeat:** ping every 10s, pong timeout at 5s
- **Reconnection:** exponential backoff with jitter, max 10 attempts
- **Visibility:** stops heartbeat when tab hidden, reconnects if hidden too long (>30s)
- **Online/Offline:** disconnects on network loss, reconnects when online
- **Cache:** stores last message per channel, replays to new subscribers
- **Send queue:** queues general messages while disconnected, flushes on reconnect

## Read vs Write

- **Reads:** WS is the primary data path. Real-time, efficient, good enough 99% of the time.
- **Writes:** REST only. Deterministic responses, proper error handling, retryable.
- **Reconciliation:** REST patches the gap when WS reconnects (see below).

## Reconnect Reconciliation

WS has no delivery guarantees. If the pipe breaks, messages are lost. No server-side queue, no sequence numbers.

### Design: Per-Channel Callbacks

`subscribe()` accepts an optional `onReconnect` callback. After reconnecting and resubscribing, the client fires registered callbacks. The WS client doesn't know what they do.

```typescript
tradingWs.subscribe(channel, handleData, {
  onReconnect: () => {
    normalizer.fetchUserPositions?.(walletAddress).then(setPositions);
  },
});
```

### Detection

An `isReconnect` boolean flag tracks whether the connection is re-establishing:

- Set `true` in: `scheduleReconnect()`, `handleOnline()`, `handleVisibilityChange()`
- Consumed and cleared in: `onopen`
- Cleared without firing in: `disconnect()`, `reconfigure()`, normal close (code 1000)

### Full-Snapshot Channels

HL positions, orders, fills send complete state on every WS push. One REST call replaces the atom. Next WS message takes over. No merge logic needed.

### Delta Channels

Extended's order book uses the accumulator pattern:

1. Subscribe WS immediately (buffer incoming messages)
2. Fetch REST snapshot
3. Seed accumulator (replays buffered deltas)
4. Resume live
