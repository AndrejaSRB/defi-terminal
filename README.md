# DeFi Terminal

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

Currently integrated with **HyperLiquid** and **Extended (StarkNet)**, with Lighter and Pacifica planned.

## Bridging & Swaps

| DEX | Provider | Purpose |
|---|---|---|
| HyperLiquid | [LiFi](https://li.fi/) | Cross-chain bridging and token swaps |
| Extended (StarkNet) | [Rhino.fi](https://rhino.fi/) | Bridge deposits to StarkNet |

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

```
src/
  services/        → Transport layer (WebSocket, framework-agnostic)
  normalizer/      → Data layer (DEX normalizers, parsers, formatters)
  atoms/           → Raw state (Jotai atoms, numbers not formatted strings)
  hooks/           → Orchestration (Tier 1: global data, Tier 2: feature-specific)
  providers/       → Mount global hooks
  components/      → UI (render only, no business logic)
```

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
