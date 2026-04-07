export interface User {
  id: string
  username: string
  email: string
  paper_balance: number
  risk_profile: 'conservative' | 'moderate' | 'aggressive'
  created_at: string
}

export interface Trade {
  id: string
  user_id: string
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  fill_price: number
  total_value: number
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED'
  notes?: string
  executed_at: string
}

export interface Position {
  id: string
  user_id: string
  symbol: string
  quantity: number
  avg_cost: number
  realised_pnl: number
  current_price?: number
  unrealised_pnl?: number
  market_value?: number
  pnl_percent?: number
  updated_at: string
}

export interface Portfolio {
  user_id: string
  paper_balance: number
  positions: Position[]
  total_invested: number
  total_market_value: number
  total_unrealised_pnl: number
  total_realised_pnl: number
  total_pnl_percent: number
}

export interface PortfolioSummary {
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  best_trade: { symbol: string; pnl: number } | null
  worst_trade: { symbol: string; pnl: number } | null
  total_realised_pnl: number
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  user: User
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    limit: number
    offset: number
  }
}

// Simulated P&L chart data point
export interface PnLPoint {
  date: string
  value: number
  pnl: number
}
