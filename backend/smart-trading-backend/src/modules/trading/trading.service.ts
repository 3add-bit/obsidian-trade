import { PoolClient } from 'pg';
import { pool } from '../../db/pool';
import { Trade } from '../../types';
import {
  InsufficientFundsError,
  InsufficientSharesError,
  NotFoundError,
} from '../../utils/errors';
import type { PlaceTradeInput, TradeHistoryQuery } from './trading.schemas';

// ── Core trade execution (all inside a serialisable transaction) ───────────────

export async function executeTrade(
  userId: string,
  input: PlaceTradeInput
): Promise<{ trade: Trade; new_balance: number }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tradeResult = input.side === 'BUY'
      ? await executeBuy(client, userId, input)
      : await executeSell(client, userId, input);

    await client.query('COMMIT');
    return tradeResult;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── BUY ───────────────────────────────────────────────────────────────────────

async function executeBuy(
  client: PoolClient,
  userId: string,
  input: PlaceTradeInput
): Promise<{ trade: Trade; new_balance: number }> {
  const { symbol, quantity, price, notes } = input;
  const totalCost = quantity * price;

  // 1. Lock and fetch user's balance
  const userRow = await client.query<{ paper_balance: string }>(
    'SELECT paper_balance FROM users WHERE id = $1 FOR UPDATE',
    [userId]
  );
  if (!userRow.rows[0]) throw new NotFoundError('User');

  const balance = parseFloat(userRow.rows[0].paper_balance);
  if (balance < totalCost) throw new InsufficientFundsError(totalCost, balance);

  // 2. Deduct balance
  const updatedUser = await client.query<{ paper_balance: string }>(
    'UPDATE users SET paper_balance = paper_balance - $1 WHERE id = $2 RETURNING paper_balance',
    [totalCost, userId]
  );

  // 3. Upsert position (weighted average cost calculation)
  await client.query(
    `INSERT INTO portfolios (user_id, symbol, quantity, avg_cost)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, symbol) DO UPDATE SET
       avg_cost = (portfolios.avg_cost * portfolios.quantity + $4 * $3)
                  / (portfolios.quantity + $3),
       quantity = portfolios.quantity + $3`,
    [userId, symbol, quantity, price]
  );

  // 4. Record trade
  const tradeRow = await client.query<Trade>(
    `INSERT INTO trades (user_id, symbol, side, quantity, fill_price, status, notes)
     VALUES ($1, $2, 'BUY', $3, $4, 'FILLED', $5)
     RETURNING *`,
    [userId, symbol, quantity, price, notes ?? null]
  );

  return {
    trade: tradeRow.rows[0],
    new_balance: parseFloat(updatedUser.rows[0].paper_balance),
  };
}

// ── SELL ──────────────────────────────────────────────────────────────────────

async function executeSell(
  client: PoolClient,
  userId: string,
  input: PlaceTradeInput
): Promise<{ trade: Trade; new_balance: number }> {
  const { symbol, quantity, price, notes } = input;
  const totalProceeds = quantity * price;

  // 1. Lock and fetch position
  const posRow = await client.query<{
    quantity: string;
    avg_cost: string;
    realised_pnl: string;
  }>(
    'SELECT quantity, avg_cost, realised_pnl FROM portfolios WHERE user_id = $1 AND symbol = $2 FOR UPDATE',
    [userId, symbol]
  );

  const position = posRow.rows[0];
  if (!position) throw new InsufficientSharesError(symbol, quantity, 0);

  const availableQty = parseFloat(position.quantity);
  if (availableQty < quantity) {
    throw new InsufficientSharesError(symbol, quantity, availableQty);
  }

  // 2. Calculate realised P&L for this sell
  const avgCost = parseFloat(position.avg_cost);
  const realisedPnl = (price - avgCost) * quantity;
  const newRealisedPnl = parseFloat(position.realised_pnl) + realisedPnl;
  const newQty = availableQty - quantity;

  // 3. Update or remove position
  if (newQty === 0) {
    await client.query(
      'DELETE FROM portfolios WHERE user_id = $1 AND symbol = $2',
      [userId, symbol]
    );
  } else {
    await client.query(
      `UPDATE portfolios SET quantity = $1, realised_pnl = $2 WHERE user_id = $3 AND symbol = $4`,
      [newQty, newRealisedPnl, userId, symbol]
    );
  }

  // 4. Credit balance
  const updatedUser = await client.query<{ paper_balance: string }>(
    'UPDATE users SET paper_balance = paper_balance + $1 WHERE id = $2 RETURNING paper_balance',
    [totalProceeds, userId]
  );

  // 5. Record trade
  const tradeRow = await client.query<Trade>(
    `INSERT INTO trades (user_id, symbol, side, quantity, fill_price, status, notes)
     VALUES ($1, $2, 'SELL', $3, $4, 'FILLED', $5)
     RETURNING *`,
    [userId, symbol, quantity, price, notes ?? null]
  );

  return {
    trade: tradeRow.rows[0],
    new_balance: parseFloat(updatedUser.rows[0].paper_balance),
  };
}

// ── Trade history ─────────────────────────────────────────────────────────────

export async function getTradeHistory(
  userId: string,
  query: TradeHistoryQuery
): Promise<{ trades: Trade[]; total: number }> {
  const conditions: string[] = ['user_id = $1'];
  const params: unknown[] = [userId];
  let p = 2;

  if (query.symbol) {
    conditions.push(`symbol = $${p++}`);
    params.push(query.symbol);
  }
  if (query.side) {
    conditions.push(`side = $${p++}`);
    params.push(query.side);
  }
  if (query.from) {
    conditions.push(`executed_at >= $${p++}`);
    params.push(query.from);
  }
  if (query.to) {
    conditions.push(`executed_at <= $${p++}`);
    params.push(query.to);
  }

  const where = conditions.join(' AND ');

  const [tradeResult, countResult] = await Promise.all([
    pool.query<Trade>(
      `SELECT * FROM trades WHERE ${where}
       ORDER BY executed_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, query.limit, query.offset]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM trades WHERE ${where}`,
      params
    ),
  ]);

  return {
    trades: tradeResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function getTradeById(userId: string, tradeId: string): Promise<Trade> {
  const result = await pool.query<Trade>(
    'SELECT * FROM trades WHERE id = $1 AND user_id = $2',
    [tradeId, userId]
  );
  if (!result.rows[0]) throw new NotFoundError('Trade');
  return result.rows[0];
}
