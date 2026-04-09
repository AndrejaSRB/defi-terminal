# HyperLiquid Integration

## APIs

| Endpoint | URL | Purpose |
|---|---|---|
| Info | `https://api.hyperliquid.xyz/info` (POST) | All read operations |
| Exchange | `https://api.hyperliquid.xyz/exchange` (POST) | All write operations |
| WebSocket | `wss://api.hyperliquid.xyz/ws` | Real-time streaming |

## WebSocket

Single persistent connection. 13+ channel types including `allMids`, `l2Book`, `trades`, `activeAssetCtx`, `candle`, `allDexsClearinghouseState`, `openOrders`, `userFills`, `spotState`, `userFundings`, `userHistoricalOrders`, `activeAssetData`, `allDexsAssetCtxs`.

Most channels send **full snapshots** on every push (positions, open orders, order book, prices). Some send **deltas** (trades, candles update the latest bar, user fills use `isSnapshot` flag for initial snapshot then incremental updates). Trades are deduplicated by ID on merge.

## Signing

### Phantom Agent Pattern

Users sign once to approve a disposable agent wallet. The agent signs all subsequent trades.

| Domain | Chain ID | Used For | Signed By |
|---|---|---|---|
| User (Arbitrum) | 42161 | Agent approval, withdrawals, abstraction | User wallet |
| L1 (HyperLiquid) | 1337 | Orders, cancels, leverage, TP/SL | Agent wallet |

### Order Signing Flow

1. Build action (asset index, price, size, tif)
2. Msgpack encode with `useBigInt64: true`
3. Append nonce (8-byte BE) + vault flag + expiry
4. Keccak256 hash → `connectionId`
5. Agent signs EIP-712 `{ source: 'a', connectionId }` on L1 domain
6. POST to `/exchange` with action + signature `{r, s, v}`

### Agent Lifecycle

- Generated locally (`generatePrivateKey`)
- Approved via EIP-712 signature (user signs)
- Stored in localStorage with `validUntil` (~90 days)
- Validated against HL server on app startup
- Auto chain switch before signing (extracts `domain.chainId` from typed data)

## Universe Ordering

Tokens are organized in groups. `allPerpMetas` returns groups as an array but **array index != group ID**. Group IDs are non-sequential.

Asset index = `groupOffset + positionInGroup`

Offsets computed from `perpDexs` API:
- Group 0 (main perps) → offset `0`
- Deployed DEXes → `110000 + deployedIndex * 10000`

Delisted tokens are kept in the universe for index stability.

### szDecimals

Per-token constant defining size precision. Also constrains price decimals: `max(6 - szDecimals, 5 sig figs)`. Must format correctly before exchange submission.

## Abstraction Mode (HIP-3)

Unified account across all market types (crypto, stocks, commodities). Enabled automatically during onboarding. Queried via `userAbstraction` info endpoint.

## Deposits

| Method | Path |
|---|---|
| Cross-chain | LI.FI routes directly to HL L1 (chain 1337) |
| Native (Arbitrum) | ERC20 transfer to bridge contract `0x2Df1c...` |

## Withdrawals

`withdraw3` action signed by user wallet (not agent). Requires Arbitrum domain signature.

## Key Constants

| Item | Value |
|---|---|
| L1 chain ID | 1337 |
| User chain ID | 42161 (Arbitrum) |
| Bridge contract | `0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7` |
| Default order expiry | nonce + 14s |
| Maintenance margin | 0.5% (tier 0) |
| Default slippage | 8% |
