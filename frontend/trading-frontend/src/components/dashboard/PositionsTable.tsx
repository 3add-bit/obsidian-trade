'use client'
import { Position } from '@/types'
import { fmtCurrency, fmtShares, fmtPercent, pnlColor, pnlBg, fmtPnL } from '@/lib/utils'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Props { positions: Position[]; loading?: boolean }

function SkeletonRow() {
  return (
    <tr className="border-t border-white/5">
      {[60, 80, 70, 90, 70, 60].map((w, i) => (
        <td key={i} className="py-4 px-4">
          <div className={`shimmer h-4 rounded w-[${w}px]`} />
        </td>
      ))}
    </tr>
  )
}

export function PositionsTable({ positions, loading = false }: Props) {
  return (
    <div className="card overflow-hidden animate-fade-up" style={{ animationDelay: '300ms' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white">Open Positions</h2>
        <span className="rounded-full bg-obsidian-700 px-2.5 py-0.5 text-xs text-gray-400">
          {loading ? '—' : positions.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              {['Symbol', 'Shares', 'Avg Cost', 'Current', 'Market Value', 'P&L'].map((h) => (
                <th key={h} className="px-4 py-3 text-[10px] font-medium uppercase tracking-widest text-gray-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              : positions.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-600">
                    No open positions.{' '}
                    <Link href="/trade" className="text-sapphire-400 hover:underline">
                      Place your first trade →
                    </Link>
                  </td>
                </tr>
              )
              : positions.map((pos) => {
                  const pnl = pos.unrealised_pnl ?? 0
                  const pct = pos.pnl_percent ?? 0
                  return (
                    <tr key={pos.id} className="border-t border-white/5 transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-obsidian-700 text-xs font-bold text-white">
                            {pos.symbol[0]}
                          </div>
                          <span className="font-mono font-medium text-white">{pos.symbol}</span>
                        </div>
                      </td>
                      <td className="font-num px-4 py-4 text-gray-300">{fmtShares(pos.quantity)}</td>
                      <td className="font-num px-4 py-4 text-gray-300">{fmtCurrency(pos.avg_cost)}</td>
                      <td className="font-num px-4 py-4 text-gray-300">
                        {pos.current_price ? fmtCurrency(pos.current_price) : '—'}
                      </td>
                      <td className="font-num px-4 py-4 text-gray-300">
                        {pos.market_value ? fmtCurrency(pos.market_value) : fmtCurrency(pos.avg_cost * pos.quantity)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn('font-num text-xs font-medium', pnlColor(pnl))}>
                            {fmtPnL(pnl)}
                          </span>
                          <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium font-num', pnlBg(pct))}>
                            {fmtPercent(pct)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
