# Adding a New DEX

## What to Implement

Three interfaces, all in `src/normalizer/`:

### 1. `DexNormalizer` (required)

The main adapter. Defines how the app reads data from the DEX.

| What              | Examples                                                                           |
| ----------------- | ---------------------------------------------------------------------------------- |
| Metadata          | `name`, `wsUrl`, `wsType`, `defaultToken`, `orderBookDepth`                        |
| Protocol hooks    | `channelKey`, `formatSubscribe`, `parseWsMessage`, `formatPing`, `isPong`          |
| Channel factories | `channels.prices()`, `channels.orderBook(coin)`, `channels.userPositions(address)` |
| Parsers           | `parseOrderBook`, `parsePrices`, `parseTrades`, `parseUserPositions`, etc.         |
| Formatters        | `formatPrice(value, coin)`, `formatSize(value, coin)`                              |
| REST fetchers     | `fetchOrderBook`, `fetchCandles`, `fetchUserPositions`, etc.                       |
| Init              | `init()` - fetch metadata, populate caches (szDecimals, universe order)            |

### 2. `DexExchange` (required for trading)

Handles write operations.

| Method                         | Purpose                             |
| ------------------------------ | ----------------------------------- |
| `placeOrder`                   | Build, sign, and submit orders      |
| `cancelOrder` / `cancelOrders` | Cancel one or batch                 |
| `modifyOrder`                  | Change price/size of existing order |
| `updateLeverage`               | Set leverage for an asset           |
| `closePosition`                | Market close                        |
| `withdraw`                     | Withdraw funds                      |

### 3. `DexOnboarding` (required for user setup)

Handles first-time setup flow.

| Method           | Purpose                                                 |
| ---------------- | ------------------------------------------------------- |
| `getSteps`       | Return onboarding steps (deposit, enable trading, etc.) |
| `executeStep`    | Run a specific step (approve agent, enable features)    |
| `isReadyToTrade` | Check if all prerequisites are met                      |

## File Structure

```
src/normalizer/your-dex/
  your-dex.ts          → DexNormalizer implementation
  exchange.ts          → DexExchange implementation
  onboarding.ts        → DexOnboarding implementation
  types/               → DEX-specific response types
  utils/
    parser.ts          → WS/REST response parsers
    format.ts          → Price/size formatting
```

## Steps

1. **Create the normalizer** - implement `DexNormalizer`. Start with `init()`, channel factories, and parsers.

2. **Add protocol hooks** - define how to subscribe/unsubscribe, parse incoming messages, handle ping/pong. Choose `wsType: 'single'` or `'multi-stream'`.

3. **Add REST fetchers** - snapshots for order book, candles, and any data needed for reconciliation on reconnect.

4. **Create the exchange** - implement `DexExchange`. Handle signing, payload formatting, API calls.

5. **Create onboarding** - implement `DexOnboarding`. Define steps, validation, wallet/agent setup.

6. **Register** - add to DEX configuration so the app can switch to it.

## What You Don't Change

- WebSocket client (`services/websocket/`)
- Hooks (`hooks/`)
- UI components (`components/`)
- Atoms (`atoms/`)

These are DEX-agnostic by design.

## Reference

See existing implementations:

- [HyperLiquid](dex/hyperliquid.md) - single WS, phantom agent signing, universe ordering
- [Extended](dex/extended.md) - multi-stream WS, StarkNet signing, REST polling
