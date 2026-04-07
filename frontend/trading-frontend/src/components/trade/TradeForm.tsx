'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth'
import { usePlaceTrade } from '@/lib/hooks/useTrades'
import { usePortfolio } from '@/lib/hooks/usePortfolio'
import { fmtCurrency, fmtShares, cn } from '@/lib/utils'

// ── Mock price ticker (replace with real market data feed) ─────────────────────
const MOCK_PRICES: Record<string, number> = {
  AAPL: 184.92, TSLA: 238.45, MSFT: 374.30, GOOGL: 140.52,
  AMZN: 178.25, NVDA: 875.40, META: 508.90, NFLX: 613.20,
  AMD:  167.45, COIN: 185.30,
}

function useMockPrice(symbol: string) {
  const [price, setPrice] = useState<number | null>(null)
  const [change, setChange] = useState(0)

  useEffect(() => {
    if (!symbol || symbol.length < 2) { setPrice(null); return }
    const base = MOCK_PRICES[symbol.toUpperCase()] ?? null
    setPrice(base)
    if (base) {
      const pct = (Math.random() - 0.48) * 0.02
      setChange(parseFloat((base * pct).toFixed(2)))
    }

    // Simulate a tick every 4 seconds
    const id = setInterval(() => {
      setPrice((prev) => {
        if (!prev) return prev
        const delta = prev * (Math.random() - 0.499) * 0.003
        return parseFloat((prev + delta).toFixed(2))
      })
    }, 4000)
    return () => clearInterval(id)
  }, [symbol])

  return { price, change }
}

// ── Order preview row ────────────────────────────────────────────────────────
function PreviewRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={cn('font-num text-sm font-medium', highlight ? 'text-white' : 'text-gray-300')}>{value}</span>
    </div>
  )
}

// ── Ticker suggestions ────────────────────────────────────────────────────────
const TICKERS = Object.keys(MOCK_PRICES)

// ── Main form ─────────────────────────────────────────────────────────────────
export function TradeForm() {
  const user        = useAuthStore((s) => s.user)
  const setUser     = useAuthStore((s) => s.setUser)
  const portfolio   = usePortfolio()
  const placeTrade  = usePlaceTrade()

  const [side,     setSide]     = useState<'BUY' | 'SELL'>('BUY')
  const [symbol,   setSymbol]   = useState('AAPL')
  const [qty,      setQty]      = useState('')
  const [notes,    setNotes]    = useState('')
  const [success,  setSuccess]  = useState<string | null>(null)
  const [showSugg, setShowSugg] = useState(false)

  const { price, change } = useMockPrice(symbol)

  const orderValue  = price && qty ? parseFloat(qty) * price : 0
  const balance     = user?.paper_balance ?? 0
  const canAfford   = side === 'SELL' || orderValue <= balance
  const position    = portfolio.data?.positions.find((p) => p.symbol === symbol.toUpperCase())
  const maxSell     = position?.quantity ?? 0

  const filteredTickers = TICKERS.filter((t) => t.startsWith(symbol.toUpperCase()) && t !== symbol.toUpperCase())

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!price || !qty || parseFloat(qty) <= 0) return

    try {
      const result = await placeTrade.mutateAsync({
        symbol: symbol.toUpperCase(),
        side,
        quantity: parseFloat(qty),
        price,
        notes: notes.trim() || undefined,
      })

      // Update local balance optimistically
      if (user) {
        setUser({ ...user, paper_balance: result.new_balance })
      }

      setSuccess(`${side} order filled: ${qty} ${symbol} @ ${fmtCurrency(price)}`)
      setQty('')
      setNotes('')
      setTimeout(() => setSuccess(null), 5000)
    } catch {
      // error handled via mutation.error
    }
  }, [price, qty, symbol, side, notes, placeTrade, user, setUser])

  const setMaxQty = () => {
    if (side === 'BUY' && price) {
      setQty(Math.floor(balance / price).toString())
    } else if (side === 'SELL') {
      setQty(maxSell.toString())
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

      {/* ── Left: Form ─────────────────────────────────────────────────────── */}
      <div className="lg:col-span-3">
        <div className="card p-6 animate-fade-up">
          <h2 className="font-display text-lg font-700 tracking-tight text-white mb-5">Place Order</h2>

          {/* BUY / SELL tabs */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-obsidian-900 p-1">
            {(['BUY', 'SELL'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={cn(
                  'rounded-lg py-2.5 text-sm font-semibold transition-all duration-200',
                  side === s
                    ? s === 'BUY'
                      ? 'bg-emerald-500/20 text-emerald-400 shadow-glow-green'
                      : 'bg-rose-500/20 text-rose-400 shadow-glow-red'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {s === 'BUY' ? '↑ Buy' : '↓ Sell'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Symbol */}
            <div className="relative flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-gray-500">Symbol</label>
              <input
                className="input-dark font-mono text-sm uppercase"
                placeholder="AAPL"
                value={symbol}
                onChange={(e) => { setSymbol(e.target.value.toUpperCase()); setShowSugg(true) }}
                onBlur={() => setTimeout(() => setShowSugg(false), 150)}
              />
              {showSugg && filteredTickers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-white/10 bg-obsidian-800 py-1 shadow-xl">
                  {filteredTickers.slice(0, 5).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onMouseDown={() => { setSymbol(t); setShowSugg(false) }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-white/5"
                    >
                      <span className="font-mono font-medium text-white">{t}</span>
                      <span className="font-num text-xs text-gray-400">{fmtCurrency(MOCK_PRICES[t])}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-widest text-gray-500">Quantity</label>
                <button
                  type="button"
                  onClick={setMaxQty}
                  className="text-[10px] text-sapphire-400 hover:text-sapphire-300 transition-colors uppercase tracking-wider"
                >
                  Max {side === 'BUY' && price ? `(${Math.floor(balance / price)})` : `(${fmtShares(maxSell)})`}
                </button>
              </div>
              <input
                type="number"
                className="input-dark font-num text-sm"
                placeholder="0"
                min="0"
                step="0.0001"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>

            {/* Quick qty buttons */}
            {side === 'SELL' && maxSell > 0 && (
              <div className="flex gap-2">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setQty((maxSell * pct / 100).toFixed(4))}
                    className="flex-1 rounded-lg border border-white/5 bg-obsidian-800 py-1.5 text-xs text-gray-400 hover:border-white/10 hover:text-white transition-all"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            )}

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-gray-500">Notes <span className="text-gray-600">(optional)</span></label>
              <textarea
                className="input-dark resize-none text-sm"
                rows={2}
                placeholder="Trade rationale..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Alerts */}
            {!canAfford && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                Insufficient funds. Need {fmtCurrency(orderValue)}, have {fmtCurrency(balance)}.
              </div>
            )}
            {side === 'SELL' && parseFloat(qty || '0') > maxSell && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                You only hold {fmtShares(maxSell)} {symbol} shares.
              </div>
            )}
            {placeTrade.error && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                {placeTrade.error.response?.data?.error ?? 'Order failed. Please try again.'}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 animate-fade-in">
                ✓ {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={
                placeTrade.isPending || !price || !qty || parseFloat(qty) <= 0 ||
                !canAfford || (side === 'SELL' && parseFloat(qty || '0') > maxSell)
              }
              className={cn(
                'mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200',
                'disabled:cursor-not-allowed disabled:opacity-40',
                side === 'BUY'
                  ? 'bg-emerald-500 text-white shadow-glow-green hover:bg-emerald-400 active:scale-[0.98]'
                  : 'bg-rose-500 text-white shadow-glow-red hover:bg-rose-400 active:scale-[0.98]'
              )}
            >
              {placeTrade.isPending ? (
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <>
                  <span>{side === 'BUY' ? '↑' : '↓'}</span>
                  <span>{side} {qty || '0'} {symbol || '—'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Right: Market info + order preview ───────────────────────────── */}
      <div className="lg:col-span-2 flex flex-col gap-4">

        {/* Price ticker card */}
        <div className="card p-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Market price</p>
              <p className="font-mono mt-0.5 text-2xl font-medium text-white">
                {symbol || '—'}
              </p>
            </div>
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg text-sm',
              change >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
            )}>
              {change >= 0 ? '▲' : '▼'}
            </div>
          </div>

          {price ? (
            <div className="mt-3">
              <p className="font-num text-3xl font-medium text-white">{fmtCurrency(price)}</p>
              <p className={cn('font-num mt-1 text-sm', change >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {change >= 0 ? '+' : ''}{fmtCurrency(change)} today
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <div className="shimmer h-9 w-40 rounded-lg" />
              <div className="shimmer mt-2 h-4 w-24 rounded" />
            </div>
          )}

          {/* Simulated mini bar */}
          <div className="mt-4 flex items-center gap-1.5">
            {Array.from({ length: 20 }).map((_, i) => {
              const h = 8 + Math.random() * 28
              const isLast = i === 19
              return (
                <div
                  key={i}
                  style={{ height: `${h}px` }}
                  className={cn(
                    'flex-1 rounded-[1px] transition-all',
                    isLast
                      ? change >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                      : 'bg-white/10'
                  )}
                />
              )
            })}
          </div>
        </div>

        {/* Order preview */}
        <div className="card p-5 animate-fade-up" style={{ animationDelay: '150ms' }}>
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gray-500">Order preview</p>
          <div className="flex flex-col">
            <PreviewRow label="Symbol"     value={symbol.toUpperCase() || '—'} />
            <PreviewRow label="Side"       value={side} />
            <PreviewRow label="Quantity"   value={qty ? fmtShares(parseFloat(qty)) : '—'} />
            <PreviewRow label="Price"      value={price ? fmtCurrency(price) : '—'} />
            <PreviewRow label="Order type" value="Market" />
            <div className="mt-2 flex items-center justify-between rounded-lg bg-obsidian-800 px-4 py-3">
              <span className="text-sm font-medium text-gray-400">Est. total</span>
              <span className={cn(
                'font-num text-lg font-semibold',
                side === 'BUY' ? 'text-rose-400' : 'text-emerald-400'
              )}>
                {side === 'BUY' ? '−' : '+'}{orderValue > 0 ? fmtCurrency(orderValue) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Existing position */}
        {position && (
          <div className="card p-5 animate-fade-in border-sapphire-500/20">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gray-500">Your position</p>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shares held</span>
                <span className="font-num font-medium text-white">{fmtShares(position.quantity)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Avg cost</span>
                <span className="font-num font-medium text-white">{fmtCurrency(position.avg_cost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Realised P&L</span>
                <span className={cn('font-num font-medium', position.realised_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {position.realised_pnl >= 0 ? '+' : ''}{fmtCurrency(position.realised_pnl)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
