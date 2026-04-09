# Extended (StarkNet) Integration

## APIs

REST-based with mandatory authentication headers. WebSocket uses multi-stream (one connection per channel).

## WebSocket

Multi-stream pattern: each channel subscription opens its own WebSocket connection. Managed by `MultiStreamWebSocket` which implements the same `TradingWsClient` interface as the single-connection client.

## Order Book

Uses the **accumulator pattern** (delta-based):

1. Subscribe WS immediately (buffer incoming messages)
2. Fetch REST snapshot for initial state
3. Seed accumulator (replays buffered deltas in order)
4. Resume live - apply WS deltas to accumulated state

This prevents race conditions between REST and WS data.

## User Data

No private WS channels for positions, orders, or balances. Uses REST polling via `fetchUserData()` triggered by tab activation and periodic refresh.

## Signing

StarkNet-based signing with Stark hash. Orders go through a settlement model. The signer is proxied through a serverless function to keep secrets server-side.

## Deposits

Rhino.fi bridge for cross-chain deposits:

1. Commit quote to Extended API
2. Approve USDC on source chain
3. Call `depositWithId()` on Rhino.fi bridge contract with quote ID
4. Funds bridge to the exchange

Supports Arbitrum, Ethereum, Base, BSC, Avalanche, Polygon.

## Key Differences from HyperLiquid

| Concern    | HyperLiquid               | Extended                  |
| ---------- | ------------------------- | ------------------------- |
| WS type    | Single connection         | Multi-stream              |
| Order book | Full snapshot per message | REST snapshot + WS deltas |
| User data  | WS channels               | REST polling              |
| Signing    | EIP-712 phantom agent     | StarkNet Stark hash       |
| Deposits   | LI.FI / native bridge     | Rhino.fi bridge           |
| Collateral | USDC                      | USDC (via StarkNet)       |
