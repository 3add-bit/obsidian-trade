'use client'
import { PortfolioSummary } from '@/types'
import { fmtCurrency, cn } from '@/lib/utils'

interface Props { summary: PortfolioSummary | undefined; loading?: boolean }

export function WinRateRing({ summary, loading = false }: Props) {
  const rate    = summary?.win_rate ?? 0
  const radius  = 40
  const circ    = 2 * Math.PI * radius
  const offset  = circ - (rate / 100) * circ
  const isPos   = (summary?.total_realised_pnl ?? 0) >= 0

  return (
    <div className="card flex flex-col gap-4 p-5 animate-fade-up" style={{ animationDelay: '350ms' }}>
      <span className="text-xs font-medium uppercase tracking-widest text-gray-500">Win rate</span>

      <div className="flex items-center gap-5">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            {!loading && (
              <circle
                cx="48" cy="48" r={radius}
                fill="none"
                stroke={rate >= 50 ? '#10b981' : '#f43f5e'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                transform="rotate(-90 48 48)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {loading
              ? <div className="shimmer h-6 w-10 rounded" />
              : <>
                  <span className={cn('font-num text-xl font-medium', rate >= 50 ? 'text-emerald-400' : 'text-rose-400')}>
                    {rate.toFixed(0)}%
                  </span>
                </>
            }
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-2 text-sm flex-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shimmer h-4 w-full rounded" />
            ))
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">Trades</span>
                <span className="font-num font-medium text-white">{summary?.total_trades ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-500">Wins</span>
                <span className="font-num font-medium text-emerald-400">{summary?.winning_trades ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-500">Losses</span>
                <span className="font-num font-medium text-rose-400">{summary?.losing_trades ?? 0}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-white/5 pt-2">
                <span className="text-gray-500">Realised P&amp;L</span>
                <span className={cn('font-num font-medium', isPos ? 'text-emerald-400' : 'text-rose-400')}>
                  {isPos ? '+' : ''}{fmtCurrency(summary?.total_realised_pnl ?? 0)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Best / Worst */}
      {!loading && summary?.best_trade && (
        <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-3 py-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Best</p>
            <p className="font-mono text-xs font-medium text-white mt-0.5">{summary.best_trade.symbol}</p>
            <p className="font-num text-xs text-emerald-400">+{fmtCurrency(summary.best_trade.pnl)}</p>
          </div>
          {summary.worst_trade && (
            <div className="rounded-lg bg-rose-500/5 border border-rose-500/10 px-3 py-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Worst</p>
              <p className="font-mono text-xs font-medium text-white mt-0.5">{summary.worst_trade.symbol}</p>
              <p className="font-num text-xs text-rose-400">{fmtCurrency(summary.worst_trade.pnl)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
