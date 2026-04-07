import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tradesApi } from '@/lib/api'
import { Trade, ApiResponse } from '@/types'
import { AxiosError } from 'axios'

interface TradeParams {
  symbol?: string
  side?: string
  limit?: number
  offset?: number
}

export function useTrades(params?: TradeParams) {
  return useQuery({
    queryKey: ['trades', params],
    queryFn: async () => {
      const { data } = await tradesApi.history(params)
      const res = data as ApiResponse<{ trades: Trade[] }>
      return { trades: res.data!.trades, meta: res.meta }
    },
    staleTime: 10_000,
  })
}

interface PlaceTradeInput {
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  price: number
  notes?: string
}

interface PlaceTradeResult {
  trade: Trade
  new_balance: number
}

export function usePlaceTrade() {
  const qc = useQueryClient()

  return useMutation<PlaceTradeResult, AxiosError<{ error: string }>, PlaceTradeInput>({
    mutationFn: async (input) => {
      const { data } = await tradesApi.place(input)
      return (data as ApiResponse<PlaceTradeResult>).data!
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trades'] })
      qc.invalidateQueries({ queryKey: ['portfolio'] })
      qc.invalidateQueries({ queryKey: ['portfolio-summary'] })
    },
  })
}
