# Tegra — Multi-DEX Trading Terminal

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

A high-performance multi-DEX trading terminal built around hexagonal architecture and real-time execution systems.

Currently integrated with **HyperLiquid** and **Extended (StarkNet)**.

## Architecture

Hexagonal (Ports & Adapters) with strict frontend layering:

```
WebSocket (service) → Normalizer (data layer) → Atoms (raw state) → Hooks (orchestrate) → UI (render)
```

```
src/
  services/        → Transport (WebSocket, REST, framework-agnostic)
  normalizer/      → DEX adapters (parsing, formatting, protocol hooks)
  atoms/           → Raw state (Jotai, derived selectors)
  hooks/           → Orchestration (bind services to state)
  providers/       → Global data lifecycle
  components/      → Presentation only
```

## Bridging & Deposits

| DEX         | Provider                      | Strategy                                                 |
| ----------- | ----------------------------- | -------------------------------------------------------- |
| HyperLiquid | [LI.FI](https://li.fi/)       | Direct routing to HL L1, native Arbitrum bridge for USDC |
| Extended    | [Rhino.fi](https://rhino.fi/) | StarkNet bridge deposits                                 |

## Stack

| Concern    | Choice                                    |
| ---------- | ----------------------------------------- |
| Runtime    | Bun                                       |
| Build      | Vite                                      |
| UI         | React + TypeScript + Tailwind + shadcn/ui |
| State      | Jotai                                     |
| Routing    | TanStack Router                           |
| Wallet     | Privy                                     |
| Formatting | Biome                                     |
| Linting    | oxlint                                    |

## Getting Started

```bash
bun install
bun run dev
```

## Commands

| Command          | Description                  |
| ---------------- | ---------------------------- |
| `bun run dev`    | Start dev server             |
| `bun run build`  | Typecheck + production build |
| `bun run format` | Format with Biome            |
| `bun run lint`   | Lint with oxlint             |
| `bun run check`  | Format + lint + typecheck    |

## Documentation

- [Architecture](docs/architecture.md) - layers, data flow, state management
- [WebSocket Design](docs/websocket.md) - protocol-agnostic client, reconnect reconciliation
- [Adding a New DEX](docs/adding-a-dex.md) - step-by-step integration guide
- [HyperLiquid](docs/dex/hyperliquid.md) - signing, universe ordering, deposits
- [Extended](docs/dex/extended.md) - StarkNet signing, order book accumulator

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Install dependencies (`bun install`)
4. Make your changes
5. Run checks (`bun run check`)
6. Submit a pull request

## License

This project is licensed under the [MIT License](LICENSE).
