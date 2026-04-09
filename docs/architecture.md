# Architecture

## Hexagonal (Ports & Adapters)

Every DEX has the same concepts (order book, positions, trades) but different protocols. The `DexNormalizer` interface is the port. Each DEX implements it as an adapter. The entire app is DEX-agnostic.

## Data Flow

```
WebSocket (service) → Normalizer (data layer) → Atoms (raw state) → Hooks (orchestrate) → UI (render)
```

## Layers

### Services (`src/services/`)

Transport only. WebSocket clients, REST calls, connection lifecycle. Framework-agnostic - no React, no Jotai.

### Normalizer (`src/normalizer/`)

DEX adapters. Parse, transform, format. Protocol hooks for WS. Pure TypeScript, no framework code.

### Atoms (`src/atoms/`)

Raw state via Jotai. Numbers only, never formatted strings. Derived atoms for computed values (e.g., `activeTokenPriceAtom` extracts one price from the full map).

### Hooks (`src/hooks/`)

Orchestration. Bind services to state. Two tiers:

- **Tier 1** (in providers) - global data pumps, always running
- **Tier 2** (in components) - feature-specific, read atoms + format via normalizer

### UI (`src/components/`)

Render only. No API calls, no normalizer imports, no business logic.

## Rules

- Logic flows downward: UI → hooks → data layer → services
- Services and normalizers must be framework-agnostic
- Atoms store raw data, hooks format for display
- UI components consume hooks, never atoms or normalizers directly
- Each component gets its own file

## State Management

**Derived over effects.** If a value can be computed during render, compute it during render. Atoms store user intent, derived atoms resolve effective values.

**Granular selectors.** `activeTokenPriceAtom` derives one token's price so consumers don't recompute when other tokens update. `activeAggregationAtom` derives the effective aggregation level from user preference + token context.

**Performance patterns:** rAF batching on high-frequency channels (order book, prices). `memo()` on components. `useCallback` for stable references passed to memoized children.
