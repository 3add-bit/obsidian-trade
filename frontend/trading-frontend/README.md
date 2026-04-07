# Smart Trading Simulator — Frontend

Next.js 14 + TypeScript + Tailwind CSS frontend with a dark obsidian fintech aesthetic.

---

## Design system

| Token | Choice | Rationale |
|---|---|---|
| Theme | Obsidian dark | Professional fintech feel, reduces eye strain |
| Display font | Syne 700/800 | Distinctive, geometric — memorable headings |
| Body font | System UI | Fast, native feel |
| Number font | DM Mono | Tabular numerals, perfectly aligned figures |
| Primary accent | Sapphire blue | Trust, precision |
| Positive P&L | Emerald green | Universal market convention |
| Negative P&L | Rose red | Universal market convention |
| Animation | CSS keyframes | Staggered fade-up on mount, zero JS cost |

---

## Folder structure

```
src/
├── app/
│   ├── page.tsx                  # Auth page (login / register)
│   ├── layout.tsx                # Root HTML shell
│   ├── globals.css               # Tailwind + custom tokens + animations
│   ├── providers.tsx             # React Query + Zustand wiring
│   ├── dashboard/
│   │   ├── layout.tsx            # Auth guard + sidebar shell
│   │   └── page.tsx              # Dashboard — stats, chart, positions, trades
│   ├── trade/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Trade page
│   └── history/
│       ├── layout.tsx
│       └── page.tsx              # Paginated trade history with filters
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx           # Nav, balance pill, user footer
│   ├── dashboard/
│   │   ├── StatCard.tsx          # Animated metric card
│   │   ├── PnLChart.tsx          # Recharts area chart
│   │   ├── PositionsTable.tsx    # Open positions with unrealised P&L
│   │   ├── RecentTrades.tsx      # Last 8 trades sidebar feed
│   │   └── WinRateRing.tsx       # SVG donut + win/loss breakdown
│   └── trade/
│       ├── TradeForm.tsx         # Core BUY/SELL form with live preview
│       └── WatchlistBar.tsx      # Live-ticking watchlist strip
├── lib/
│   ├── api.ts                    # Axios instance + interceptors + endpoints
│   ├── utils.ts                  # fmt helpers, P&L series builder
│   └── hooks/
│       ├── usePortfolio.ts       # React Query portfolio hooks
│       └── useTrades.ts          # React Query trades + mutation hook
├── store/
│   └── auth.ts                   # Zustand auth store with localStorage sync
└── types/
    └── index.ts                  # Shared domain types
```

---

## Setup

### Prerequisites
- Node.js 20+
- Running backend (`smart-trading-backend`) on port 3001

### 1. Install
```bash
npm install
```

### 2. Environment
```bash
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 3. Run
```bash
npm run dev   # → http://localhost:3000
```

---

## Key architecture decisions

**Auth flow** — `Zustand` persists `isAuthenticated` + `user` to localStorage. On mount, each protected layout checks this flag and redirects to `/` if false. The Axios interceptor silently refreshes the access token on 401 and replays the original request — no user interaction needed.

**React Query** — All server state lives in React Query. `usePortfolio` refetches every 30 s, `useTrades` every 10 s. `usePlaceTrade` is a mutation that invalidates both caches on success, so the dashboard updates immediately after a trade.

**Mock prices** — `TradeForm` and `WatchlistBar` use a client-side mock price engine with 3–4 s ticks. In production, replace with a WebSocket subscription to your market data service.

**P&L chart** — `buildPnLSeries` reconstructs a cumulative P&L curve from the trade history, then feeds it to the `PnLChart` Recharts component. No extra endpoint needed.

**Shimmer loading** — Every data-dependent UI block renders a shimmer skeleton (`shimmer` CSS class) while loading, using the exact same dimensions as the real content. Zero layout shift.

**Fonts** — Syne is loaded via Google Fonts in `globals.css`. DM Mono is used for all numeric values via the `.font-num` utility class, ensuring perfectly aligned P&L figures in tables.
