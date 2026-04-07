import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../db/pool';
import { env } from '../../config/env';
import { User, AccessTokenPayload, RefreshTokenPayload } from '../../types';
import { ConflictError, UnauthorizedError } from '../../utils/errors';
import type { RegisterInput, LoginInput } from './auth.schemas';

const SALT_ROUNDS = 12;

// ── Token helpers ──────────────────────────────────────────────────────────────

function issueAccessToken(user: User): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    username: user.username,
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

async function issueRefreshToken(userId: string): Promise<string> {
  const tokenId = uuidv4();
  const rawToken = `${userId}.${tokenId}.${crypto.randomBytes(32).toString('hex')}`;
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  // Return signed JWT so the client stores one opaque token
  const payload: RefreshTokenPayload = { sub: userId, tokenId };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
}

// ── Service methods ────────────────────────────────────────────────────────────

export async function registerUser(
  input: RegisterInput
): Promise<{ user: User; access_token: string; refresh_token: string }> {
  // Check uniqueness
  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [input.email, input.username]
  );
  if (existing.rowCount && existing.rowCount > 0) {
    throw new ConflictError('Email or username is already registered');
  }

  const password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const result = await pool.query<User>(
    `INSERT INTO users (username, email, password_hash, paper_balance, risk_profile)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, email, paper_balance, risk_profile, created_at`,
    [input.username, input.email, password_hash, env.DEFAULT_PAPER_BALANCE, input.risk_profile]
  );

  const user = result.rows[0];
  const access_token = issueAccessToken(user);
  const refresh_token = await issueRefreshToken(user.id);

  return { user, access_token, refresh_token };
}

export async function loginUser(
  input: LoginInput
): Promise<{ user: User; access_token: string; refresh_token: string }> {
  const result = await pool.query<User & { password_hash: string }>(
    `SELECT id, username, email, password_hash, paper_balance, risk_profile, created_at
     FROM users WHERE email = $1`,
    [input.email]
  );

  const row = result.rows[0];
  if (!row) throw new UnauthorizedError('Invalid email or password');

  const valid = await bcrypt.compare(input.password, row.password_hash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  const { password_hash: _ph, ...user } = row;

  const access_token = issueAccessToken(user as User);
  const refresh_token = await issueRefreshToken(user.id);

  return { user: user as User, access_token, refresh_token };
}

export async function refreshTokens(
  rawRefreshToken: string
): Promise<{ access_token: string; refresh_token: string }> {
  let payload: RefreshTokenPayload;
  try {
    payload = jwt.verify(rawRefreshToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // Rotate: delete old token record by user + tokenId
  const deleted = await pool.query(
    `DELETE FROM refresh_tokens
     WHERE user_id = $1 AND expires_at > NOW()
     RETURNING id`,
    [payload.sub]
  );

  if (!deleted.rowCount || deleted.rowCount === 0) {
    throw new UnauthorizedError('Refresh token not found or expired');
  }

  const userResult = await pool.query<User>(
    'SELECT id, username, email, paper_balance, risk_profile, created_at FROM users WHERE id = $1',
    [payload.sub]
  );
  const user = userResult.rows[0];
  if (!user) throw new UnauthorizedError('User not found');

  const access_token = issueAccessToken(user);
  const refresh_token = await issueRefreshToken(user.id);

  return { access_token, refresh_token };
}

export async function getMe(userId: string): Promise<User> {
  const result = await pool.query<User>(
    'SELECT id, username, email, paper_balance, risk_profile, created_at FROM users WHERE id = $1',
    [userId]
  );
  if (!result.rows[0]) throw new UnauthorizedError('User not found');
  return result.rows[0];
}
