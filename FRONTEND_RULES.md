# FinDebate Arena — Autonomous Multi-Agent Financial Stress-Testing Terminal
## Frontend Engineering Contract & Agent Directives

---

## 1. Project Mandate & Scope Boundary
- **Role:** Autonomous Multi-Agent Financial Terminal (Phase 1: Frontend Engine).
- **Core Directive:** Execute **PHASE 1 (FRONTEND ONLY)**.
- **Strict Boundary:** Do NOT write, scaffold, or generate Python backend files, FastAPI routes, Docker containers, or database schemas. All market data, WebSocket feeds, and LLM text generation must be powered by a fully typed, local simulation stream (`lib/mock-streamer.ts`). The frontend must function and feel indistinguishable from a live, real-time institutional product.

---

## 2. Technical Stack
- **Framework:** Next.js 15+ (App Router, Server Components where applicable, TypeScript strictly enforced).
- **Styling:** Tailwind CSS (utility-first, zero raw custom CSS files except global CSS variables in `globals.css`).
- **UI Primitives:** shadcn/ui (Radix UI accessible headless components).
- **Icons:** `lucide-react`.
- **Financial Charting:** TradingView `lightweight-charts` (Canvas-based rendering for historical candlesticks and volume).
- **Mathematical & Probability Charting:** `echarts-for-react` / Apache ECharts (for multi-path Monte Carlo probability fan charts).
- **Animation & Transitions:** `framer-motion` (for agent turn transitions, live pulse badges, and streaming typewriter cursors).
- **State & Streaming:** React Hooks (`useState`, `useEffect`, `useCallback`, `useRef`).

---

## 3. Visual Identity & Design System (Bloomberg / Linear Terminal Vibe)
- **Theme:** Forced Dark Mode only (`dark` class permanently applied to root `<html>`). No light mode toggles.
- **Surface Color Tokens:**
  - Base Viewport Background: `bg-zinc-950` (`#09090b`)
  - Elevated Container / Cards: `bg-zinc-900/60` with `border border-zinc-800/80`
  - Floating Overlays & Modals: `bg-zinc-900` with `backdrop-blur-md`
- **Typography Guidelines:**
  - Primary UI & Narrative Text: `Geist Sans` or `Inter`.
  - Financial Data, Tickers, Metrics, Percentages, Timestamps: **Always Monospace** (`font-mono` / `Geist Mono`). This eliminates horizontal layout jitter as streaming numbers update.
- **Agent Semantic Color Palette:**
  - **The Bull:** Emerald (`text-emerald-400`, `border-emerald-500/30`, `bg-emerald-500/10`)
  - **The Bear:** Crimson/Rose (`text-rose-400`, `border-rose-500/30`, `bg-rose-500/10`)
  - **The Quant:** Cyan (`text-cyan-400`, `border-cyan-500/30`, `bg-cyan-500/10`)
  - **The Judge:** Amber (`text-amber-400`, `border-amber-500/30`, `bg-amber-500/10`)

---

## 4. Directory & File Blueprint

```text
frontend/
├── app/
│   ├── layout.tsx                     # Forced dark mode root shell + Geist fonts
│   ├── page.tsx                       # Screen 1: Landing Page + Cmd+K Ticker Command Menu
│   ├── auth/
│   │   └── page.tsx                   # Screen 2: Clean Glassmorphic Auth (GitHub/Google/Magic Link)
│   └── arena/
│       └── [ticker]/
│           ├── page.tsx               # Screen 3: The Split-Screen Live Arena Workspace
│           └── loading.tsx            # Pulse skeleton state during ticker load
├── components/
│   ├── ui/                            # shadcn/ui components (button, card, dialog, badge, tabs, etc.)
│   ├── arena/
│   │   ├── price-chart.tsx            # TradingView Lightweight Charts canvas wrapper
│   │   ├── monte-carlo-chart.tsx      # Apache ECharts 500-path simulation fan chart
│   │   ├── agent-terminal.tsx         # Live scrolling debate message stream
│   │   ├── agent-card.tsx             # Card featuring agent role badge, avatar, and typed text
│   │   ├── metrics-strip.tsx          # Monospace financial metrics ribbon (P/E, FCF, Debt)
│   │   └── dossier-modal.tsx          # Screen 4: Executive Verdict Dialog & PDF Print Layout
│   └── shared/
│       ├── navbar.tsx                 # Top bar featuring market status pulse & connection badge
│       └── command-menu.tsx           # Cmd+K quick ticker search palette
├── lib/
│   ├── mock-streamer.ts               # Simulated WebSocket streaming engine with token delays
│   ├── mock-data.ts                   # Seed data for NVDA, TSLA, AAPL (Candles + Monte Carlo paths)
│   └── utils.ts                       # Tailwind cn() class merger
└── types/
    └── arena.ts                       # TypeScript interfaces for market feeds & agent streams
```

## 5. TypeScript Data Contracts (types/arena.ts)
All entities must adhere strictly to these schemas without using any `any`:

```typescript
export type AgentRole = 'bull' | 'bear' | 'quant' | 'judge';

export interface AgentMessage {
  id: string;
  role: AgentRole;
  authorName: string;
  content: string;
  isStreaming: boolean;
  timestamp: string;
  metricsCited?: { label: string; value: string; sentiment: 'positive' | 'negative' | 'neutral' }[];
}

export interface CandlestickData {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MonteCarloSimulationData {
  timeSteps: string[];
  paths: number[][]; // Array of 500 paths with projected price arrays
  confidence95Upper: number[];
  confidence95Lower: number[];
  meanPath: number[];
  volatility: number;
  valueAtRisk95: number;
}

export interface TickerSummary {
  ticker: string;
  companyName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  peRatio: number;
  marketCap: string;
  freeCashFlow: string;
  totalDebt: string;
  historicalCandles: CandlestickData[];
  monteCarlo: MonteCarloSimulationData;
}

export interface ExecutiveVerdict {
  score: number; // 1 to 100
  recommendation: 'STRONG OVERWEIGHT' | 'MODERATE OVERWEIGHT' | 'NEUTRAL / HOLD' | 'UNDERWEIGHT';
  synthesis: string;
  bullWeight: number;
  bearWeight: number;
  keyCatalysts: string[];
  keyRisks: string[];
  stopLossLevel: number;
  targetPrice: number;
}
```

## 6. Mock Streaming Simulation Engine (lib/mock-streamer.ts)
To allow full frontend development without requiring a live backend, the mock streaming engine must simulate an asynchronous WebSocket connection:

- **Phase 0 (0ms):** Emits `TickerSummary` containing historical prices and key metrics. Price chart renders immediately.
- **Phase 1 (600ms):** Initializes The Bull agent. Emits text word-by-word with a 25ms delay per token:
  "Revenue expanded by 122% year-over-year to $30.0B. Data center compute demand remains supply-constrained, giving the enterprise an 85% gross margin profile and unprecedented pricing power."
- **Phase 2 (3200ms):** Initializes The Bear agent. Emits rebuttal word-by-word with a 25ms delay per token:
  "Rebuttal: 42% of total top-line revenue is concentrated in just 4 hyperscalers. Accounts receivable surged 35%, signaling potential inventory build and delayed cash realization. Current 48x P/E multiple leaves zero margin for execution error."
- **Phase 3 (5800ms):** Initializes The Quant agent. Emits coordinates for 500 Monte Carlo paths. The ECharts canvas triggers an animated entrance showing the 95% confidence interval cone.
- **Phase 4 (8200ms):** Initializes The Judge agent. Synthesizes both arguments, delivers the final score, and enables the "View Executive Dossier" button.

## 7. Screen Implementation Specs
### Screen 1: Landing Page (/)
- Centered high-contrast typography: "AUTONOMOUS MULTI-AGENT QUANT & ALPHA STRESS TESTING".
- Interactive search bar with `Cmd + K` keybinding to open the command palette.
- Quick-pick pills for trending tickers: NVDA, TSLA, AAPL, MSFT.
- Live preview card showing a looped interactive snapshot of the debate feed.

### Screen 2: Modern Auth (/auth)
- Glassmorphic card centered on a dark canvas (`max-w-md`).
- Primary OAuth actions: "Continue with GitHub" and "Continue with Google".
- Monochromatic divider: `OR CONTINUE WITH WORK EMAIL`.
- Input field for passwordless Magic Link dispatch.

### Screen 3: The Main Workspace (/arena/[ticker])
- **Desktop Layout:** 60% Left Dock (Charts) / 40% Right Dock (Agent Feed).
- **Left Dock (Charts):**
  - Top: TradingView Lightweight Candlestick Chart (Historical daily bars with crosshair support).
  - Bottom: Apache ECharts Monte Carlo Probabilistic Fan Chart (Glowing cyan bands, 500 projected trajectories).
  - Footer Strip: Monospace financial metrics bar (P/E: 48.2, Debt: $8.4B, FCF: $27.1B).
- **Right Dock (The Terminal Feed):**
  - Auto-scrolling transcript container.
  - Distinct colored card borders and avatars per agent.
  - Blinking vertical cursor (`|`) during active streaming phases.
  - Interactive follow-up input bar at the base of the terminal.

### Screen 4: Executive Dossier Modal (components/arena/dossier-modal.tsx)
- Triggered by clicking "View Executive Dossier" or automatically upon Judge verdict completion.
- Circular radial gauge showing the 1–100 Consensus Score.
- Side-by-side comparison matrix: Bull Key Drivers vs. Bear Forensic Vulnerabilities.
- Print stylesheet enabled (`@media print`) so clicking "Download Signed PDF Report" opens a cleanly formatted, print-ready document.

## 8. Agent Execution Rules
- **No External Framework Violations:** Use standard Next.js App Router patterns.
- **Component Isolation:** Ensure all client-side logic (`useState`, `useEffect`, canvas hooks) contains the `'use client'` directive at the top of the file.
- **No Placeholders:** Generate complete code implementations for charts, mock data, and components without truncating functions or writing empty stubs.
- **Step-by-Step Delivery:**
  - **Step 1:** Scaffold Next.js, Tailwind, and install shadcn/ui components (button, card, dialog, badge, tabs, input, scroll-area).
  - **Step 2:** Set up `types/arena.ts` and `lib/mock-data.ts`.
  - **Step 3:** Implement `lib/mock-streamer.ts` and verify simulated streaming events.
  - **Step 4:** Build chart components (`price-chart.tsx` and `monte-carlo-chart.tsx`).
  - **Step 5:** Build `agent-card.tsx`, `agent-terminal.tsx`, and the Arena workspace page.
  - **Step 6:** Build `dossier-modal.tsx`, `navbar.tsx`, and the Landing page (`/`).
