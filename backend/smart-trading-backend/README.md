# Smart Trading Simulator — Backend API

Node.js + Express + TypeScript backend with JWT authentication, paper trading engine, and portfolio tracking.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js 20 LTS | LTS stability, native async |
| Framework | Express 4 | Battle-tested, huge ecosystem |
| Language | TypeScript (strict) | Type safety end-to-end |
| Database | PostgreSQL 15 | ACID transactions for trade integrity |
| Auth | JWT (access + refresh) | Stateless, scalable |
| Validation | Zod | Runtime schema validation + inference |
| Security | Helmet, CORS, rate-limit | Production hardening |

---

## Folder structure

```
src/
├── config/
│   └── env.ts                # Zod-validated env vars
├── db/
│   ├── pool.ts               # PostgreSQL connection pool
│   └── migrate.ts            # SQL schema (run once)
├── middleware/
│   ├── authenticate.ts       # JWT guard
│   ├── validate.ts           # Zod request validator
│   └── errorHandler.ts       # Global error handler
├── modules/
│   ├── auth/
│   │   ├── auth.schemas.ts
│   │   ├── auth.service.ts   # register / login / refresh / me
│   │   ├── auth.controller.ts
│   │   └── auth.routes.ts
│   ├── trading/
│   │   ├── trading.schemas.ts
│   │   ├── trading.service.ts  # buy/sell engine (transactional)
│   │   ├── trading.controller.ts
│   │   └── trading.routes.ts
│   └── portfolio/
│       ├── portfolio.schemas.ts
│       ├── portfolio.service.ts  # positions + P&L + summary
│       ├── portfolio.controller.ts
│       └── portfolio.routes.ts
├── types/
│   └── index.ts              # Shared domain types
├── utils/
│   ├── response.ts           # sendSuccess / sendError helpers
│   └── errors.ts             # AppError subclasses
├── app.ts                    # Express app factory
└── server.ts                 # Entrypoint + graceful shutdown
```

---

## Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
```

### 3. Run database migration
```bash
npm run db:migrate
```

### 4. Start development server
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
npm start
```

---

## API reference

### Auth  `POST /api/v1/auth/...`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create account |
| POST | `/login` | — | Get tokens |
| POST | `/refresh` | — | Rotate refresh token |
| GET | `/me` | ✅ | Current user |

**Register**
```json
POST /api/v1/auth/register
{
  "username": "trader1",
  "email": "trader@example.com",
  "password": "SecurePass1",
  "risk_profile": "moderate"
}
```

**Login response**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "username": "trader1", "paper_balance": 100000 },
    "access_token": "<jwt>",
    "refresh_token": "<jwt>"
  }
}
```

---

### Trades  `POST/GET /api/v1/trades`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Place a BUY or SELL order |
| GET | `/` | Trade history (filterable) |
| GET | `/:id` | Single trade |

**Place trade**
```json
POST /api/v1/trades
Authorization: Bearer <access_token>
{
  "symbol": "AAPL",
  "side": "BUY",
  "quantity": 10,
  "price": 182.50,
  "notes": "Earnings play"
}
```

**History query params**
```
GET /api/v1/trades?symbol=AAPL&side=BUY&limit=20&offset=0&from=2024-01-01T00:00:00Z
```

---

### Portfolio  `GET /api/v1/portfolio`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Full portfolio with all positions |
| GET | `/summary` | Win rate, best/worst trade stats |
| GET | `/:symbol` | Single position |

**Inject live prices** (optional query param):
```
GET /api/v1/portfolio?prices={"AAPL":185.20,"TSLA":242.10}
```
When prices are passed, unrealised P&L and market value are computed server-side.

---

## Design decisions

**Transactions for trade execution** — buy and sell both run inside a `BEGIN/COMMIT` block with `FOR UPDATE` row locks on the user and position rows. No race conditions possible.

**Append-only trades table** — trades are never updated or deleted, only inserted with `status = FILLED`. This gives you a complete audit log and makes P&L reconstruction deterministic.

**Weighted average cost** — position `avg_cost` is recomputed on each BUY using the standard WAC formula: `(old_avg × old_qty + new_price × new_qty) / (old_qty + new_qty)`. SELL trades don't change avg_cost, they only reduce quantity and accrue `realised_pnl`.

**Token rotation** — each `/refresh` call deletes the old DB row and issues a brand-new refresh token. Replay attacks are neutralised; token theft is detectable.

**Zod everywhere** — all request bodies and query strings are validated and coerced through Zod schemas before reaching the service layer. Controllers never touch raw `req.body` types.
