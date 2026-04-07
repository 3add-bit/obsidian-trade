import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function fmt(value: number, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(value)
}

export function fmtCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function fmtPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function fmtPnL(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${fmtCurrency(value)}`
}

export function fmtShares(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(value)
}

export function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function fmtDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function pnlColor(value: number): string {
  if (value > 0) return 'text-emerald-400'
  if (value < 0) return 'text-rose-400'
  return 'text-gray-400'
}

export function pnlBg(value: number): string {
  if (value > 0) return 'bg-emerald-500/10 text-emerald-400'
  if (value < 0) return 'bg-rose-500/10 text-rose-400'
  return 'bg-white/5 text-gray-400'
}

// Generate mock P&L history from trade list for the chart
export function buildPnLSeries(startBalance: number, trades: Array<{ executed_at: string; side: string; total_value: number }>): Array<{ date: string; value: number; pnl: number }> {
  if (!trades.length) {
    // Return flat series for empty state
    const now = Date.now()
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(now - (29 - i) * 86_400_000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: startBalance,
      pnl: 0,
    }))
  }

  const sorted = [...trades].sort((a, b) => new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime())
  let balance = startBalance
  const points: Array<{ date: string; value: number; pnl: number }> = []

  for (const t of sorted) {
    const delta = t.side === 'SELL' ? t.total_value : -t.total_value
    balance += delta
    points.push({
      date: new Date(t.executed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Number(balance.toFixed(2)),
      pnl: Number((balance - startBalance).toFixed(2)),
    })
  }

  return points
}
