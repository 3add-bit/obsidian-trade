'use client'
import { useState } from 'react'
import { useTrades } from '@/lib/hooks/useTrades'
import { fmtCurrency, fmtDateTime, cn } from '@/lib/utils'
import { Trade } from '@/types'

// ── Filter bar ────────────────────────────────────────────────────────────────
interface Filters { symbol: string; side: '' | 'BUY' | 'SELL' }

function FilterBar({ filters, onChange }: {
  filters: Filters
  onChange: (f: Partial<Filters>) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 animate-fade-up">
      <input
        className="input-dark h-9 w-36 py-0 font-mono text-sm uppercase placeholder:normal-case"
        placeholder="Symbol..."
        value={filters.symbol}
        onChange={(e) => onChange({ symbol: e.target.value.toUpperCase() })}
      />

      {/* Side filter */}
      <div className="flex gap-1 rounded-xl bg-obsidian-800 p-1">
        {([['', 'All'], ['BUY', '↑ Buy'], ['SELL', '↓ Sell']] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => onChange({ side: v as Filters['side'] })}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              filters.side === v
                ? v === 'BUY'   ? 'bg-emerald-500/20 text-emerald-400'
                : v === 'SELL'  ? 'bg-rose-500/20 text-rose-400'
                :                 'bg-obsidian-600 text-white'
                : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Trade row ──────────────────────────────────────────────────────────────────
function TradeRow({ trade, index }: { trade: Trade; index: number }) {
  const isBuy = trade.side === 'BUY'
  return (
    <tr
      className="border-t border-white/5 transition-colors hover:bg-white/[0.02] animate-fade-up"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Symbol + side */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold',
            isBuy ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
          )}>
            {isBuy ? '↑' : '↓'}
          </div>
          <div>
            <p className="font-mono font-medium text-white">{trade.symbol}</p>
            <p className={cn(
              'text-[10px] font-medium uppercase tracking-wider mt-0.5',
              isBuy ? 'text-emerald-500' : 'text-rose-500'
            )}>
              {trade.side}
            </p>
          </div>
        </div>
      </td>

      {/* Quantity */}
      <td className="font-num px-5 py-4 text-sm text-gray-300">
        {trade.quantity.toLocaleString('en-US', { maximumFractionDigits: 4 })}
      </td>

      {/* Price */}
      <td className="font-num px-5 py-4 text-sm text-gray-300">
        {fmtCurrency(trade.fill_price)}
      </td>

      {/* Total */}
      <td className="font-num px-5 py-4 text-sm font-medium text-white">
        {fmtCurrency(trade.total_value)}
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <span className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider',
          trade.status === 'FILLED'    ? 'bg-emerald-500/10 text-emerald-400' :
          trade.status === 'CANCELLED' ? 'bg-gray-500/10 text-gray-400' :
          trade.status === 'REJECTED'  ? 'bg-rose-500/10 text-rose-400' :
                                         'bg-amber-500/10 text-amber-400'
        )}>
          <span className="h-1 w-1 rounded-full bg-current" />
          {trade.status}
        </span>
      </td>

      {/* Date */}
      <td className="font-num px-5 py-4 text-xs text-gray-500">
        {fmtDateTime(trade.executed_at)}
      </td>

      {/* Notes */}
      <td className="px-5 py-4 text-xs text-gray-600 max-w-[160px]">
        <span className="truncate block">{trade.notes || '—'}</span>
      </td>
    </tr>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20

export default function HistoryPage() {
  const [filters, setFilters]   = useState<Filters>({ symbol: '', side: '' })
  const [page,    setPage]      = useState(0)

  const { data, isLoading } = useTrades({
    symbol: filters.symbol || undefined,
    side:   filters.side   || undefined,
    limit:  PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const trades = data?.trades ?? []
  const total  = data?.meta?.total ?? 0
  const pages  = Math.ceil(total / PAGE_SIZE)

  function updateFilter(partial: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...partial }))
    setPage(0)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-700 tracking-tight text-white">Trade History</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Loading…' : `${total.toLocaleString()} total trades`}
          </p>
        </div>
        <FilterBar filters={filters} onChange={updateFilter} />
      </div>

      {/* Table card */}
      <div className="card overflow-hidden animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                {['Asset', 'Qty', 'Fill price', 'Total', 'Status', 'Date', 'Notes'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-[10px] font-medium uppercase tracking-widest text-gray-600 bg-obsidian-900/50">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-t border-white/5">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="shimmer h-4 rounded" style={{ width: `${50 + Math.random() * 60}px` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : trades.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-600">
                      {filters.symbol || filters.side
                        ? 'No trades match your filters.'
                        : 'No trades yet. Go make some money!'}
                    </td>
                  </tr>
                )
                : trades.map((trade, i) => (
                    <TradeRow key={trade.id} trade={trade} index={i} />
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
            <p className="font-num text-xs text-gray-500">
              Page {page + 1} of {pages} · {total} trades
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 text-gray-400 transition-all hover:border-white/10 hover:text-white disabled:opacity-30"
              >
                ←
              </button>

              {/* Page number pills */}
              {Array.from({ length: Math.min(pages, 5) }).map((_, i) => {
                const pg = Math.max(0, Math.min(page - 2, pages - 5)) + i
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all',
                      pg === page
                        ? 'bg-sapphire-500/20 text-sapphire-400'
                        : 'text-gray-500 hover:text-white'
                    )}
                  >
                    {pg + 1}
                  </button>
                )
              })}

              <button
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                disabled={page >= pages - 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 text-gray-400 transition-all hover:border-white/10 hover:text-white disabled:opacity-30"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary row */}
      {!isLoading && trades.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 animate-fade-up" style={{ animationDelay: '200ms' }}>
          {[
            {
              label: 'Showing',
              value: `${trades.length} / ${total}`,
            },
            {
              label: 'Buy orders',
              value: String(trades.filter((t) => t.side === 'BUY').length),
            },
            {
              label: 'Sell orders',
              value: String(trades.filter((t) => t.side === 'SELL').length),
            },
            {
              label: 'Page volume',
              value: fmtCurrency(trades.reduce((s, t) => s + t.total_value, 0)),
            },
          ].map(({ label, value }) => (
            <div key={label} className="card px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-600">{label}</p>
              <p className="font-num mt-1 text-base font-medium text-white">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
