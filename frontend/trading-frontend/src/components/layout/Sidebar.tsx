'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import { fmtCurrency } from '@/lib/utils'

const NAV = [
  {
    href: '/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    label: 'Dashboard',
  },
  {
    href: '/trade',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
    label: 'Trade',
  },
  {
    href: '/history',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    label: 'History',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    router.push('/')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-white/5 bg-obsidian-900/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sapphire-500/20 border border-sapphire-500/30">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round"/>
            <polyline points="16 7 22 7 22 13"              stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="font-display text-base font-700 tracking-tight text-white">
          Obsidian<span className="text-sapphire-400">Trade</span>
        </span>
      </div>

      {/* Balance pill */}
      <div className="mx-4 mt-4 rounded-xl border border-white/5 bg-obsidian-800 p-4">
        <p className="text-[10px] uppercase tracking-widest text-gray-500">Paper balance</p>
        <p className="font-num mt-1 text-xl font-medium text-white">
          {user ? fmtCurrency(user.paper_balance) : '—'}
        </p>
        <div className={cn(
          'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
          user?.risk_profile === 'conservative' ? 'bg-emerald-500/10 text-emerald-400' :
          user?.risk_profile === 'aggressive'   ? 'bg-rose-500/10 text-rose-400' :
                                                  'bg-sapphire-500/10 text-sapphire-400'
        )}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {user?.risk_profile ?? 'moderate'}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 pt-4">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn('nav-item', pathname === item.href && 'active')}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      {/* User footer */}
      <div className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sapphire-500/20 text-xs font-bold text-sapphire-400">
            {user?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">{user?.username}</p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
          </div>
          <button onClick={handleLogout} title="Sign out" className="text-gray-600 hover:text-rose-400 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
