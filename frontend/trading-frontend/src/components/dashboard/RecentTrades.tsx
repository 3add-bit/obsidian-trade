'use client'
import Link from 'next/link'
import { Trade } from '@/types'
import { fmtCurrency, fmtDateTime, cn } from '@/lib/utils'

interface Props { trades: Trade[]; loading?: boolean }

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between border-t border-white/5 px-5 py-3.5">
      <div className="flex items-center gap-3">
        <div className="shimmer h-7 w-7 rounded-lg" />
        <div className="flex flex-col gap-1.5">
          <div className="shimmer h-3.5 w-20 rounded" />
          <div className="shimmer h-3 w-28 rounded" />
        </div>
      </div>
      <div className="shimmer h-4 w-16 rounded" />
    </div>
  )
}

export function RecentTrades({ trades, loading = false }: Props) {
  return (
    <div className="card overflow-hidden animate-fade-up" style={{ animationDelay: '400ms' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white">Recent Trades</h2>
        <Link href="/history" className="text-xs text-sapphire-400 hover:text-sapphire-300 transition-colors">
          View all →
        </Link>
      </div>

      <div className="flex flex-col">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          : trades.length === 0
          ? (
            <div className="py-12 text-center text-sm text-gray-600">
              No trades yet.{' '}
              <Link href="/trade" className="text-sapphire-400 hover:underline">Start trading →</Link>
            </div>
          )
          : trades.slice(0, 8).map((trade) => (
            <div key={trade.id} className="flex items-center justify-between border-t border-white/5 px-5 py-3.5 transition-colors hover:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                {/* Side badge */}
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold',
                  trade.side === 'BUY'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-rose-500/15 text-rose-400'
                )}>
                  {trade.side === 'BUY' ? '↑' : '↓'}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-white">{trade.symbol}</span>
                    <span className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                      trade.side === 'BUY'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    )}>
                      {trade.side}
                    </span>
                  </div>
                  <p className="font-num text-xs text-gray-500">
                    {trade.quantity} shares @ {fmtCurrency(trade.fill_price)} · {fmtDateTime(trade.executed_at)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-num text-sm font-medium text-white">{fmtCurrency(trade.total_value)}</p>
                <p className={cn(
                  'text-[10px] font-medium uppercase tracking-wide',
                  trade.status === 'FILLED' ? 'text-emerald-500' : 'text-gray-500'
                )}>
                  {trade.status}
                </p>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
