# DeFi Terminal

Manual trading terminal supporting multiple DEXes. Currently integrated with HyperLiquid, with Extended, Lighter, and Pacifica planned.

## Stack

- **Runtime**: Bun
- **Build**: Vite
- **UI**: React + TypeScript + shadcn/ui + Tailwind CSS v4
- **State**: Jotai
- **Wallet**: Privy
- **Architecture**: Hexagonal (Ports & Adapters)

## Getting Started

```bash
bun install
bun run dev
```

## Commands

| Command | Description |
|---|---|
| `bun run dev` | Start dev server |
| `bun run build` | Typecheck + production build |
| `bun run preview` | Preview production build |
| `bun run format` | Auto-format with Biome |
| `bun run lint` | Lint with oxlint |
| `bun run check` | Format + lint + typecheck |

## Architecture

See [CLAUDE.md](./CLAUDE.md) for detailed architecture rules and conventions.

```
src/
  services/        → Transport layer (WebSocket, framework-agnostic)
  normalizer/      → Data layer (DEX normalizers, parsers, formatters)
  atoms/           → Raw state (Jotai atoms, numbers not formatted strings)
  hooks/           → Orchestration (Tier 1: global data, Tier 2: feature-specific)
  providers/       → Mount global hooks
  components/      → UI (render only, no business logic)
```

## Adding a New DEX

Implement `DexNormalizer` from `src/normalizer/normalizer.ts` — no changes needed to services, hooks, or UI.
