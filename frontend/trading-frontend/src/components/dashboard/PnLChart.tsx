'use client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { PnLPoint } from '@/types'
import { fmtCurrency } from '@/lib/utils'

interface Props {
  data: PnLPoint[]
  loading?: boolean
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string
}) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  const isPos = val >= 0
  return (
    <div className="rounded-xl border border-white/10 bg-obsidian-700 px-4 py-3 shadow-xl">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`font-num mt-1 text-sm font-medium ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isPos ? '+' : ''}{fmtCurrency(val)}
      </p>
    </div>
  )
}

export function PnLChart({ data, loading = false }: Props) {
  if (loading) {
    return (
      <div className="card p-5 animate-fade-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="shimmer h-5 w-32 rounded" />
          <div className="shimmer h-4 w-20 rounded" />
        </div>
        <div className="shimmer h-52 w-full rounded-lg" />
      </div>
    )
  }

  const isPositive = data.length > 0 && data[data.length - 1]?.pnl >= 0
  const strokeColor = isPositive ? '#10b981' : '#f43f5e'
  const gradientId  = isPositive ? 'gradGreen' : 'gradRed'
  const lastPnL     = data[data.length - 1]?.pnl ?? 0

  return (
    <div className="card p-5 animate-fade-up" style={{ animationDelay: '200ms' }}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Portfolio P&amp;L</h2>
          <p className="text-xs text-gray-500 mt-0.5">{data.length} data points</p>
        </div>
        <span className={`font-num text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? '+' : ''}{fmtCurrency(lastPnL)}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />

          <XAxis
            dataKey="date"
            tick={{ fill: '#4b5563', fontSize: 10, fontFamily: 'DM Mono' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fill: '#4b5563', fontSize: 10, fontFamily: 'DM Mono' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="pnl"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: strokeColor, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
