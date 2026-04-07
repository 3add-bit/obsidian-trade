export interface User {
  id: string;
  username: string;
  email: string;
  paper_balance: number;
  risk_profile: 'conservative' | 'moderate' | 'aggressive';
  created_at: Date;
}

export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  fill_price: number;
  total_value: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  notes?: string;
  executed_at: Date;
}

export interface Position {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  avg_cost: number;
  realised_pnl: number;
  // Computed fields (injected via market price)
  current_price?: number;
  unrealised_pnl?: number;
  market_value?: number;
  pnl_percent?: number;
  updated_at: Date;
}

export interface Portfolio {
  user_id: string;
  paper_balance: number;
  positions: Position[];
  total_invested: number;
  total_market_value: number;
  total_unrealised_pnl: number;
  total_realised_pnl: number;
  total_pnl_percent: number;
}

// JWT payloads
export interface AccessTokenPayload {
  sub: string;   // user.id
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

// Augment Express Request with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}
