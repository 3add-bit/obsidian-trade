import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        sans:    ['var(--font-geist)', 'sans-serif'],
        mono:    ['var(--font-dm-mono)', 'monospace'],
      },
      colors: {
        obsidian: {
          950: '#05060a',
          900: '#0a0c12',
          800: '#111318',
          700: '#191c24',
          600: '#21252f',
          500: '#2a2f3c',
          400: '#3a4055',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          glow: '#10b98133',
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
          glow: '#f43f5e33',
        },
        sapphire: {
          400: '#60a5fa',
          500: '#3b82f6',
          glow: '#3b82f633',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
      },
      backgroundImage: {
        'grid-obsidian':
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'fade-up':   'fadeUp 0.4s ease both',
        'fade-in':   'fadeIn 0.3s ease both',
        'tick-up':   'tickUp 0.6s ease both',
        'tick-down': 'tickDown 0.6s ease both',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer':   'shimmer 1.5s linear infinite',
        'number-in': 'numberIn 0.3s ease both',
      },
      keyframes: {
        fadeUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        tickUp:   { '0%,100%': { color: 'inherit' }, '30%': { color: '#10b981' } },
        tickDown: { '0%,100%': { color: 'inherit' }, '30%': { color: '#f43f5e' } },
        pulseGlow:{ '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
        shimmer:  { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        numberIn: { from: { opacity: '0', transform: 'translateY(-4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      boxShadow: {
        'card':        '0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':  '0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.5)',
        'glow-green':  '0 0 20px rgba(16,185,129,0.2)',
        'glow-red':    '0 0 20px rgba(244,63,94,0.2)',
        'glow-blue':   '0 0 20px rgba(59,130,246,0.2)',
        'inner-glow':  'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
    },
  },
  plugins: [],
}

export default config
