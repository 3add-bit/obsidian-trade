import { useQuery } from '@tanstack/react-query'
import { portfolioApi } from '@/lib/api'
import { Portfolio, PortfolioSummary, ApiResponse } from '@/types'

export function usePortfolio(prices?: Record<string, number>) {
  return useQuery({
    queryKey: ['portfolio', prices],
    queryFn: async () => {
      const { data } = await portfolioApi.get(prices)
      return (data as ApiResponse<{ portfolio: Portfolio }>).data!.portfolio
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

export function usePortfolioSummary() {
  return useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: async () => {
      const { data } = await portfolioApi.summary()
      return (data as ApiResponse<{ summary: PortfolioSummary }>).data!.summary
    },
    staleTime: 60_000,
  })
}
