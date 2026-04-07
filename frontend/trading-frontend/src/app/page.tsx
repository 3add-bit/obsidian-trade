'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { User } from '@/types'
import { cn } from '@/lib/utils'

// ── Tiny UI atoms ─────────────────────────────────────────────────────────────
function GridBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-grid-obsidian bg-grid opacity-100" />
      <div className="absolute inset-0 bg-gradient-radial from-sapphire-500/5 via-transparent to-transparent" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-sapphire-500/10 blur-3xl" />
    </div>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-sapphire-500/20 border border-sapphire-500/30">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="16 7 22 7 22 13" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span className="font-display text-lg font-700 tracking-tight text-white">
        Obsidian<span className="text-sapphire-400">Trade</span>
      </span>
    </div>
  )
}

// ── Form fields ───────────────────────────────────────────────────────────────
interface FieldProps {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
}

function Field({ label, type = 'text', value, onChange, placeholder, error }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-widest text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'input-dark font-num text-sm',
          error && 'border-rose-500/50 focus:border-rose-500/80 focus:shadow-none'
        )}
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  )
}

// ── Main Auth Page ────────────────────────────────────────────────────────────
export default function AuthPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    risk_profile: 'moderate',
  })

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res =
        mode === 'login'
          ? await authApi.login({ email: form.email, password: form.password })
          : await authApi.register(form)

      const { user, access_token, refresh_token } = res.data.data as {
        user: User; access_token: string; refresh_token: string
      }
      setAuth(user, access_token, refresh_token)
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <GridBackground />

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Logo />
          <div>
            <h1 className="font-display text-3xl font-800 tracking-tight text-white">
              {mode === 'login' ? 'Welcome back' : 'Start trading'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {mode === 'login'
                ? 'Sign in to your trading account'
                : 'Create an account with $100,000 paper balance'}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="card p-7">
          {/* Tab switcher */}
          <div className="mb-6 flex gap-1 rounded-xl bg-obsidian-900 p-1">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={cn(
                  'flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-all',
                  mode === m
                    ? 'bg-obsidian-700 text-white shadow-card'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <Field label="Username" value={form.username} onChange={set('username')} placeholder="traderpro" />
            )}
            <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />

            {mode === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-widest text-gray-500">Risk profile</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['conservative', 'moderate', 'aggressive'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set('risk_profile')(r)}
                      className={cn(
                        'rounded-lg border py-2.5 text-xs font-medium capitalize transition-all',
                        form.risk_profile === r
                          ? r === 'conservative' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                          : r === 'aggressive'   ? 'border-rose-500/50 bg-rose-500/10 text-rose-400'
                          : 'border-sapphire-500/50 bg-sapphire-500/10 text-sapphire-400'
                          : 'border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-400'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'mt-2 flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all',
                'bg-sapphire-500 text-white shadow-glow-blue hover:bg-sapphire-400',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {loading ? (
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Paper trading only. No real money involved.
        </p>
      </div>
    </div>
  )
}
