import { pool } from './pool';

const schema = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Users
  CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    paper_balance NUMERIC(18, 2) NOT NULL DEFAULT 100000.00,
    risk_profile  VARCHAR(20)  NOT NULL DEFAULT 'moderate'
                    CHECK (risk_profile IN ('conservative','moderate','aggressive')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

  -- Refresh tokens
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

  -- Trades (append-only, never UPDATE or DELETE)
  CREATE TABLE IF NOT EXISTS trades (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol      VARCHAR(10)    NOT NULL,
    side        VARCHAR(4)     NOT NULL CHECK (side IN ('BUY','SELL')),
    quantity    NUMERIC(18, 8) NOT NULL CHECK (quantity > 0),
    fill_price  NUMERIC(18, 8) NOT NULL CHECK (fill_price > 0),
    total_value NUMERIC(18, 2) GENERATED ALWAYS AS (quantity * fill_price) STORED,
    status      VARCHAR(10)    NOT NULL DEFAULT 'FILLED'
                  CHECK (status IN ('PENDING','FILLED','CANCELLED','REJECTED')),
    notes       TEXT,
    executed_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_trades_user     ON trades(user_id);
  CREATE INDEX IF NOT EXISTS idx_trades_symbol   ON trades(symbol);
  CREATE INDEX IF NOT EXISTS idx_trades_executed ON trades(executed_at DESC);

  -- Portfolios (current open positions, one row per user+symbol)
  CREATE TABLE IF NOT EXISTS portfolios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol          VARCHAR(10)    NOT NULL,
    quantity        NUMERIC(18, 8) NOT NULL DEFAULT 0,
    avg_cost        NUMERIC(18, 8) NOT NULL DEFAULT 0,
    realised_pnl    NUMERIC(18, 2) NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, symbol)
  );
  CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id);

  -- Watchlists
  CREATE TABLE IF NOT EXISTS watchlists (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol     VARCHAR(10) NOT NULL,
    added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, symbol)
  );

  -- Auto-update updated_at trigger
  CREATE OR REPLACE FUNCTION update_timestamp()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
  $$ LANGUAGE plpgsql;

  DO $$ BEGIN
    CREATE TRIGGER trg_users_updated
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

  DO $$ BEGIN
    CREATE TRIGGER trg_portfolios_updated
      BEFORE UPDATE ON portfolios
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`;

async function migrate(): Promise<void> {
  console.log('Running migrations...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(schema);
    await client.query('COMMIT');
    console.log('✅  Migrations complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
