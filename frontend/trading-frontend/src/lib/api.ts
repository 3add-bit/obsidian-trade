import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request: attach access token ──────────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response: silent token refresh on 401 ────────────────────────────────────
let isRefreshing = false
let queue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        const newAccessToken: string = data.data.access_token
        const newRefreshToken: string = data.data.refresh_token

        localStorage.setItem('access_token', newAccessToken)
        localStorage.setItem('refresh_token', newRefreshToken)

        queue.forEach((cb) => cb(newAccessToken))
        queue = []

        original.headers.Authorization = `Bearer ${newAccessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

// ── Auth endpoints ────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: { username: string; email: string; password: string; risk_profile?: string }) =>
    api.post('/auth/register', body),
  login: (body: { email: string; password: string }) =>
    api.post('/auth/login', body),
  me: () => api.get('/auth/me'),
}

// ── Trading endpoints ─────────────────────────────────────────────────────────
export const tradesApi = {
  place: (body: { symbol: string; side: 'BUY' | 'SELL'; quantity: number; price: number; notes?: string }) =>
    api.post('/trades', body),
  history: (params?: { symbol?: string; side?: string; limit?: number; offset?: number }) =>
    api.get('/trades', { params }),
  byId: (id: string) => api.get(`/trades/${id}`),
}

// ── Portfolio endpoints ───────────────────────────────────────────────────────
export const portfolioApi = {
  get: (prices?: Record<string, number>) =>
    api.get('/portfolio', { params: prices ? { prices: JSON.stringify(prices) } : {} }),
  summary: () => api.get('/portfolio/summary'),
  position: (symbol: string, prices?: Record<string, number>) =>
    api.get(`/portfolio/${symbol}`, { params: prices ? { prices: JSON.stringify(prices) } : {} }),
}
