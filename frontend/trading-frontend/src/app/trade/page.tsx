'use client'
import { TradeForm } from '@/components/trade/TradeForm'
import { WatchlistBar } from '@/components/trade/WatchlistBar'

export default function TradePage() {
  return (
    <div className="flex flex-col gap-0">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-700 tracking-tight text-white">Trade</h1>
          <p className="mt-1 text-sm text-gray-500">Place market orders with simulated fills</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400">Market open</span>
        </div>
      </div>

      {/* Live watchlist ticker row */}
      <WatchlistBar />

      {/* Main form */}
      <TradeForm />
    </div>
  )
}
