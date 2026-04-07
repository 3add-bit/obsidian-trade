import { pool } from '../../db/pool';
import { Portfolio, Position } from '../../types';
import { NotFoundError } from '../../utils/errors';

// ── Types ──────────────────────────────────────────────────────────────────────

interface RawPosition {
  id: string;
  user_id: string;
  symbol: string;
  quantity: string;
  avg_cost: string;
  realised_pnl: string;
  updated_at: Date;
}

// ❌ REMOVE THIS (unused)
// interface PositionWithPrice extends RawPosition {
//   current_price?: number;
// }

// In production this calls your Market Data service or a price cache (Redis).
function injectMarketPrices(
  positions: RawPosition[],
  prices: Record<string, number> = {}
): Position[] {
  return positions.map((raw) => {
    const quantity     = parseFloat(raw.quantity);
    const avg_cost     = parseFloat(raw.avg_cost);
    const realised_pnl = parseFloat(raw.realised_pnl);
    const current_price = prices[raw.symbol] ?? null;

    const market_value      = current_price !== null ? quantity * current_price : undefined;
    const unrealised_pnl    = current_price !== null ? (current_price - avg_cost) * quantity : undefined;
    const cost_basis        = avg_cost * quantity;
    const pnl_percent       =
      unrealised_pnl !== undefined && cost_basis > 0
        ? (unrealised_pnl / cost_basis) * 100
        : undefined;

    return {
      id: raw.id,
      user_id: raw.user_id,
      symbol: raw.symbol,
      quantity,
      avg_cost,
      realised_pnl,
      updated_at: raw.updated_at,
      ...(current_price    !== null  && { current_price }),
      ...(market_value     !== undefined && { market_value }),
      ...(unrealised_pnl   !== undefined && { unrealised_pnl }),
      ...(pnl_percent      !== undefined && { pnl_percent }),
    };
  });
}

// ── Service methods ───────────────────────────────────────────────────────────

export async function getPortfolio(
  userId: string,
  prices: Record<string, number> = {}
): Promise<Portfolio> {
  const [userResult, positionResult] = await Promise.all([
    pool.query<{ paper_balance: string }>(
      'SELECT paper_balance FROM users WHERE id = $1',
      [userId]
    ),
    pool.query<RawPosition>(
      `SELECT id, user_id, symbol, quantity, avg_cost, realised_pnl, updated_at
       FROM portfolios
       WHERE user_id = $1 AND quantity > 0
       ORDER BY symbol`,
      [userId]
    ),
  ]);

  if (!userResult.rows[0]) throw new NotFoundError('User');

  const paper_balance    = parseFloat(userResult.rows[0].paper_balance);
  const positions        = injectMarketPrices(positionResult.rows, prices);

  const total_invested       = positions.reduce((s, p) => s + p.avg_cost * p.quantity, 0);
  const total_market_value   = positions.reduce((s, p) => s + (p.market_value ?? p.avg_cost * p.quantity), 0);
  const total_unrealised_pnl = positions.reduce((s, p) => s + (p.unrealised_pnl ?? 0), 0);
  const total_realised_pnl   = positions.reduce((s, p) => s + p.realised_pnl, 0);
  const total_pnl_percent    =
    total_invested > 0 ? (total_unrealised_pnl / total_invested) * 100 : 0;

  return {
    user_id: userId,
    paper_balance,
    positions,
    total_invested,
    total_market_value,
    total_unrealised_pnl,
    total_realised_pnl,
    total_pnl_percent,
  };
}

export async function getPosition(
  userId: string,
  symbol: string,
  prices: Record<string, number> = {}
): Promise<Position> {
  const result = await pool.query<RawPosition>(
    `SELECT id, user_id, symbol, quantity, avg_cost, realised_pnl, updated_at
     FROM portfolios
     WHERE user_id = $1 AND symbol = $2`,
    [userId, symbol.toUpperCase()]
  );

  if (!result.rows[0]) throw new NotFoundError(`Position in ${symbol}`);

  return injectMarketPrices([result.rows[0]], prices)[0];
}

export async function getPortfolioSummary(userId: string): Promise<{
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  best_trade: { symbol: string; pnl: number } | null;
  worst_trade: { symbol: string; pnl: number } | null;
  total_realised_pnl: number;
}> {
  const result = await pool.query<any>( // 🔥 TYPE FIX
    `WITH sell_trades AS (
       SELECT
         t.symbol,
         t.quantity::numeric AS qty,
         t.fill_price::numeric AS sell_price,
         t.executed_at
       FROM trades t
       WHERE t.user_id = $1 AND t.side = 'SELL' AND t.status = 'FILLED'
     ),
     buy_avg AS (
       SELECT
         symbol,
         SUM(quantity::numeric * fill_price::numeric) / SUM(quantity::numeric) AS wavg_buy
       FROM trades
       WHERE user_id = $1 AND side = 'BUY' AND status = 'FILLED'
       GROUP BY symbol
     ),
     pnl_per_trade AS (
       SELECT
         s.symbol,
         (s.sell_price - b.wavg_buy) * s.qty AS pnl
       FROM sell_trades s
       JOIN buy_avg b ON b.symbol = s.symbol
     )
     SELECT
       COUNT(*)::int AS total_trades,
       COUNT(*) FILTER (WHERE pnl > 0)::int AS winning_trades,
       COUNT(*) FILTER (WHERE pnl <= 0)::int AS losing_trades,
       COALESCE(SUM(pnl), 0)::numeric AS total_realised_pnl,
       (SELECT symbol FROM pnl_per_trade ORDER BY pnl DESC LIMIT 1) AS best_symbol,
       (SELECT pnl FROM pnl_per_trade ORDER BY pnl DESC LIMIT 1) AS best_pnl,
       (SELECT symbol FROM pnl_per_trade ORDER BY pnl ASC LIMIT 1) AS worst_symbol,
       (SELECT pnl FROM pnl_per_trade ORDER BY pnl ASC LIMIT 1) AS worst_pnl
     FROM pnl_per_trade`,
    [userId]
  );

  const row = result.rows[0] || {};

  const total_trades   = row.total_trades   ?? 0;
  const winning_trades = row.winning_trades ?? 0;
  const losing_trades  = row.losing_trades  ?? 0;

  return {
    total_trades,
    winning_trades,
    losing_trades,
    win_rate: total_trades > 0 ? (winning_trades / total_trades) * 100 : 0,
    total_realised_pnl: parseFloat(row.total_realised_pnl ?? '0'),
    best_trade: row.best_symbol
      ? { symbol: row.best_symbol, pnl: parseFloat(row.best_pnl) }
      : null,
    worst_trade: row.worst_symbol
      ? { symbol: row.worst_symbol, pnl: parseFloat(row.worst_pnl) }
      : null,
  };
}