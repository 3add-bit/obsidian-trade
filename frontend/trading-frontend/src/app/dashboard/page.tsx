'use client'
import { useMemo } from 'react'
import { useAuthStore } from '@/store/auth'
import { usePortfolio, usePortfolioSummary } from '@/lib/hooks/usePortfolio'
import { useTrades } from '@/lib/hooks/useTrades'
import { StatCard } from '@/components/dashboard/StatCard'
import { PnLChart } from '@/components/dashboard/PnLChart'
import { PositionsTable } from '@/components/dashboard/PositionsTable'
import { RecentTrades } from '@/components/dashboard/RecentTrades'
import { WinRateRing } from '@/components/dashboard/WinRateRing'
import { buildPnLSeries, fmtCurrency, fmtPercent, pnlColor } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const user     = useAuthStore((s) => s.user)
  const portfolio = usePortfolio()
  const summary   = usePortfolioSummary()
  const trades    = useTrades({ limit: 50 })

  const pnlData = useMemo(() => {
    if (!trades.data?.trades || !user) return []
    return buildPnLSeries(user.paper_balance, trades.data.trades)
  }, [trades.data?.trades, user])

  const port = portfolio.data
  const sum  = summary.data

  const totalPnL    = port?.total_unrealised_pnl ?? 0
  const totalPnLPct = port?.total_pnl_percent    ?? 0
  const isPos       = totalPnL >= 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex flex-col gap-6">

      {/* Page header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-700 tracking-tight text-white">
            {greeting}, <span className="text-sapphire-400">{user?.username}</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 rounded-full border border-white/5 bg-obsidian-800 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-400">Paper trading</span>
        </div>
      </div>

      {/* Top stat row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Portfolio value"
          value={fmtCurrency((port?.total_market_value ?? 0) + (port?.paper_balance ?? 0))}
          sub="Cash + open positions"
          accent="blue"
          loading={portfolio.isLoading}
          delay={0}
        />
        <StatCard
          label="Cash balance"
          value={fmtCurrency(port?.paper_balance ?? user?.paper_balance ?? 0)}
          sub="Available to trade"
          accent="amber"
          loading={portfolio.isLoading}
          delay={60}
        />
        <StatCard
          label="Unrealised P&L"
          value={`${isPos ? '+' : ''}${fmtCurrency(totalPnL)}`}
          sub={fmtPercent(totalPnLPct) + ' overall'}
          accent={isPos ? 'green' : 'red'}
          trend={isPos ? 'up' : 'down'}
          loading={portfolio.isLoading}
          delay={120}
        />
        <StatCard
          label="Positions"
          value={String(port?.positions?.length ?? '—')}
          sub={`${sum?.total_trades ?? 0} total trades`}
          accent="blue"
          loading={portfolio.isLoading}
          delay={180}
        />
      </div>

      {/* P&L chart + win rate ring */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PnLChart data={pnlData} loading={trades.isLoading} />
        </div>
        <WinRateRing summary={sum} loading={summary.isLoading} />
      </div>

      {/* Positions table */}
      <PositionsTable
        positions={port?.positions ?? []}
        loading={portfolio.isLoading}
      />

      {/* Recent trades */}
      <RecentTrades
        trades={trades.data?.trades ?? []}
        loading={trades.isLoading}
      />

      {/* P&L breakdown row */}
      {!portfolio.isLoading && port && (
        <div
          className="grid grid-cols-3 gap-4 animate-fade-up"
          style={{ animationDelay: '500ms' }}
        >
          {[
            { label: 'Total invested',    value: fmtCurrency(port.total_invested),      accent: 'text-gray-300' },
            { label: 'Realised P&L',      value: fmtCurrency(port.total_realised_pnl),  accent: pnlColor(port.total_realised_pnl) },
            { label: 'Unrealised P&L',    value: fmtCurrency(port.total_unrealised_pnl),accent: pnlColor(port.total_unrealised_pnl) },
          ].map(({ label, value, accent }) => (
            <div key={label} className="card px-5 py-4">
              <p className="text-xs uppercase tracking-widest text-gray-600">{label}</p>
              <p className={cn('font-num mt-1.5 text-lg font-medium', accent)}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
