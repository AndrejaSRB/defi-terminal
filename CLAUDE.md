# Engineering Rules

## Workflow

### 1. Plan First
- Enter plan mode for any non-trivial task: 3+ steps, architectural decisions, refactors, shared logic, or uncertainty.
- For frontend work, identify upfront what belongs in `services`, `data layer`, `hooks`, and `UI`.
- Use plan mode for build, verification, and review.
- If implementation starts going sideways, stop and re-plan.
- Reject plans that mix transport, business logic, orchestration, and rendering.
- **Never start coding without presenting a plan for user review first.**

### 2. Use Subagents Aggressively
- Use subagents to keep main context clean.
- Offload research, exploration, comparison, and parallel analysis.
- Give each subagent one focused task.
- Synthesize centrally.

### 3. Learn From Mistakes
- After any user correction, update `tasks/lessons.md`.
- Record the mistake pattern and the rule that would prevent it.
- Review relevant lessons before similar work.

### 4. Verify Before Done
- Never mark a task done without proof.
- Verify behavior, not just code shape.
- Run `bun run check` (format + lint + typecheck) before marking work complete.
- Ask: "Would a staff engineer approve this?"
- If logic is in the wrong layer, refactor before done.

### 5. Demand Elegance
- For non-trivial work, ask whether there is a cleaner solution.
- If the fix feels hacky, rework it.
- Do not over-engineer simple, local changes.
- Prefer simple, low-coupling, well-separated designs.

### 6. Fix Bugs Autonomously
- When given a bug, investigate and fix it directly.
- Use logs, errors, tests, and code evidence.
- Find root cause, not just symptom.
- Minimize user hand-holding.

---

## Architecture: Hexagonal / Ports & Adapters

This project uses **Hexagonal Architecture** (Ports & Adapters) with strict frontend layering.

### Pattern
- **Ports** = interfaces (`DexNormalizer`, `ProtocolHooks`) — define contracts
- **Adapters** = implementations (`hyperliquidNormalizer`, `TradingWebSocket`) — plug into ports
- New DEXes are added by implementing `DexNormalizer` — no changes to services, hooks, or UI

### Data Flow
```
WebSocket (service) → Normalizer (data layer) → Atoms (raw data) → Hooks (format + orchestrate) → UI (render)
```

### Hook Tiers
- **Tier 1 — Global hooks** (in DexProvider, always running): pump raw data into atoms. No formatting.
  - `useWsConnection`, `useDexPrices`, `useUserPositions`
- **Tier 2 — Feature hooks** (called by specific components): read atoms + format via normalizer → display-ready data.
  - `useTokenHeader(coin)`, `useOrderBook(coin)`, `usePositionsTable()`

### Key Rules
- Atoms store **raw numbers**, never formatted strings
- `normalizer.formatPrice()` is called in **Tier 2 hooks only**, never in UI components
- UI components never import normalizer or atoms directly — they use feature hooks
- WebSocket depends only on `ProtocolHooks`, never on `DexNormalizer`
- Normalizer is framework-agnostic — no React, no Jotai

---

## Frontend Architecture

### 7. Default Layering
Always structure non-trivial frontend code as:

`services -> data layer -> hooks -> UI`

### 8. Hard Layer Boundaries
- Keep `services` and `data layer` framework-agnostic.
- Business logic should live outside React/framework code by default.
- UI is for rendering and minimal local visual state only.
- Hooks are for orchestration, async lifecycle, and UI-facing state.
- Data layer owns transformation and business logic.
- If logic can live outside React/framework code, it should.

### 9. Layer Responsibilities

#### Services (`src/services/`)
- WebSocket transport, REST calls
- Handle connection lifecycle, reconnection, heartbeat
- No business logic, no UI formatting, no framework dependencies

#### Data Layer (`src/normalizer/`)
- Parse, normalize, validate, merge, transform, format
- DEX-specific implementations behind `DexNormalizer` interface
- Own all reusable data shaping
- Pure, framework-agnostic TypeScript

#### Atoms (`src/atoms/`)
- Store raw data (numbers, not formatted strings)
- No derived formatting — that belongs in hooks
- Jotai atoms only

#### Hooks (`src/hooks/`)
- Orchestrate services + data layer
- Tier 1: global data pumps (in providers) — live in `src/hooks/`
- Tier 2: feature-specific, read atoms + normalizer.format → display-ready
- Do not own reusable business logic
- **Only shared/global hooks live in `src/hooks/`** (Tier 1, `useMediaQuery`, `useDocumentTitle`)
- **Component-specific hooks live in `component-folder/hooks/`** next to the component that uses them

#### Providers (`src/providers/`)
- Mount Tier 1 hooks
- No rendering logic

#### UI (`src/components/`)
- Render data from feature hooks
- Bind interactions
- Handle styling and minimal ephemeral UI state
- No API calls, no business rules, no normalizer imports

### 10. Placement Rules
Before writing code, classify the change:

1. Transport / API call → `services`
2. Data shaping / formatting / normalization → `normalizer`
3. Raw state storage → `atoms`
4. UI state orchestration / async flow / binding → `hooks`
5. Rendering → `components`

### 11. Escalation Rule
If logic is in the wrong place, move it downward:
- `UI → hooks`
- `hooks → data layer`
- `data layer → services` only if truly transport-related

### 12. Forbidden Anti-Patterns
- No API calls in UI components
- No business logic in JSX/render code
- No `normalizer` imports in UI components
- No `formatPrice`/`formatSize` calls in UI components
- No formatted strings in atoms
- No reusable mapping/formatting in components
- No heavy data manipulation in hooks
- **Never define 2+ components in the same file** — each component gets its own file
- No framework-specific code in services or normalizer
- No raw backend response shapes leaking directly into UI

### 13. Frontend Done Check
Before marking frontend work done, verify:
- Services are framework-agnostic
- Data transformation lives in the normalizer
- Atoms store raw data, not formatted strings
- Hooks orchestrate but do not own core domain logic
- UI only renders/presents via feature hooks
- Backend data is not leaking directly into presentation
- `bun run check` passes

---

## Task Management

### 14. Task Flow
- Write plan in `tasks/todo.md` with checkable items
- Track progress as work completes
- Add a review/results section before closing
- Update `tasks/lessons.md` after corrections

### 15. Plan Standard
- Plans must be concrete and verifiable
- Avoid vague tasks
- For frontend work, explicitly separate:
  - service changes
  - data layer changes
  - hook changes
  - UI changes

---

## Core Principles

### 16. Simplicity First
- Make changes as simple as possible
- Prefer minimal-impact solutions
- Add abstractions only when they clearly improve clarity or separation

### 17. No Laziness
- Find the root cause
- No temporary patches unless explicitly requested
- No local hacks that preserve broken architecture
- Hold work to senior engineer standards

### 18. Minimal Impact
- Touch only what is necessary
- Keep blast radius low
- Preserve existing correct behavior

### 19. Framework-Agnostic by Default
- Reusable logic should not depend on UI framework/runtime unless necessary
- Prefer pure, testable modules for business and transformation logic
- Keep framework code focused on composition and rendering

### 20. Clarity Over Convenience
- Do not place logic in hooks/components just because it is faster
- Prefer correct boundaries over convenience
- Make ownership obvious to the next engineer

### 21. Staff-Level Bar
Before presenting work, ask:
- Is ownership of logic obvious?
- Is architecture cleaner after the change?
- Is this easy to test?
- Is hidden coupling reduced?
- Would I approve this in review?

---

## Project Stack

| Concern | Choice |
|---|---|
| Runtime / Package manager | Bun |
| Build / Dev | Vite |
| UI Framework | React |
| Language | TypeScript |
| Components | shadcn/ui (Radix, Nova preset) |
| State | Jotai |
| Routing | TanStack Router |
| Layout | react-resizable-panels |
| Styling | Tailwind CSS v4 |
| Theming | CSS custom properties (dark only, dynamic) |
| Formatting | Biome (format only, no lint) |
| Linting | oxlint |
| Wallet | Privy |
| Architecture | Hexagonal (Ports & Adapters) |

## Commands

| Command | What it does |
|---|---|
| `bun run dev` | Start dev server |
| `bun run build` | Typecheck + build |
| `bun run format` | Auto-format (Biome) |
| `bun run lint` | Lint (oxlint) |
| `bun run check` | Format check + lint + typecheck |
