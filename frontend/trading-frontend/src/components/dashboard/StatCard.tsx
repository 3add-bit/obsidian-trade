import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  accent?: 'green' | 'red' | 'blue' | 'amber'
  loading?: boolean
  delay?: number
}

const accentMap = {
  green: { dot: 'bg-emerald-500', val: 'text-emerald-400', glow: 'shadow-glow-green', border: 'border-emerald-500/20' },
  red:   { dot: 'bg-rose-500',    val: 'text-rose-400',    glow: 'shadow-glow-red',   border: 'border-rose-500/20' },
  blue:  { dot: 'bg-sapphire-500',val: 'text-sapphire-400',glow: 'shadow-glow-blue',  border: 'border-sapphire-500/20' },
  amber: { dot: 'bg-amber-500',   val: 'text-amber-400',   glow: '',                  border: 'border-amber-500/20' },
}

export function StatCard({ label, value, sub, trend, accent = 'blue', loading = false, delay = 0 }: StatCardProps) {
  const ac = accentMap[accent]

  return (
    <div
      className="card flex flex-col gap-3 p-5 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-gray-500">{label}</span>
        <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse-glow', ac.dot)} />
      </div>

      {loading ? (
        <div className="shimmer h-8 w-3/4 rounded-lg" />
      ) : (
        <div className="flex items-end gap-2">
          <span className={cn('font-num text-2xl font-medium', ac.val)}>{value}</span>
          {trend && (
            <span className={cn(
              'mb-0.5 text-lg',
              trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-gray-500'
            )}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}
            </span>
          )}
        </div>
      )}

      {sub && !loading && (
        <p className="text-xs text-gray-500">{sub}</p>
      )}
    </div>
  )
}
