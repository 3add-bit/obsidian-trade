'use client'
import { useState, useEffect } from 'react'
import { fmtCurrency, cn } from '@/lib/utils'

const WATCHLIST = [
  { symbol: 'AAPL',  base: 184.92 },
  { symbol: 'TSLA',  base: 238.45 },
  { symbol: 'MSFT',  base: 374.30 },
  { symbol: 'NVDA',  base: 875.40 },
  { symbol: 'GOOGL', base: 140.52 },
  { symbol: 'AMZN',  base: 178.25 },
  { symbol: 'META',  base: 508.90 },
]

interface TickerItem { symbol: string; price: number; change: number; changePct: number }

export function WatchlistBar() {
  const [tickers, setTickers] = useState<TickerItem[]>(
    WATCHLIST.map((w) => {
      const change    = parseFloat((w.base * (Math.random() - 0.48) * 0.04).toFixed(2))
      const changePct = parseFloat(((change / w.base) * 100).toFixed(2))
      return { symbol: w.symbol, price: w.base, change, changePct }
    })
  )

  useEffect(() => {
    const id = setInterval(() => {
      setTickers((prev) =>
        prev.map((t) => {
          const delta = t.price * (Math.random() - 0.499) * 0.003
          const newPrice = parseFloat((t.price + delta).toFixed(2))
          return { ...t, price: newPrice }
        })
      )
    }, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="mb-6 flex gap-3 overflow-x-auto pb-1 animate-fade-up">
      {tickers.map((t) => (
        <div
          key={t.symbol}
          className="flex-shrink-0 card flex items-center gap-4 px-4 py-3 hover:border-white/12 transition-all cursor-default"
        >
          <div>
            <p className="font-mono text-xs font-semibold text-white">{t.symbol}</p>
            <p className="font-num text-sm font-medium text-white mt-0.5">{fmtCurrency(t.price)}</p>
          </div>
          <div className={cn(
            'rounded-md px-1.5 py-0.5 text-[10px] font-medium font-num',
            t.change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          )}>
            {t.change >= 0 ? '+' : ''}{t.changePct.toFixed(2)}%
          </div>
        </div>
      ))}
    </div>
  )
}
