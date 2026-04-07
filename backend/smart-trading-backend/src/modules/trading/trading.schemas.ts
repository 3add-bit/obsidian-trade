import { z } from 'zod';

export const placeTradeSchema = z.object({
  symbol: z
    .string()
    .min(1)
    .max(10)
    .toUpperCase()
    .regex(/^[A-Z0-9.]+$/, 'Invalid ticker symbol'),
  side: z.enum(['BUY', 'SELL']),
  quantity: z.coerce
    .number()
    .positive('Quantity must be positive')
    .multipleOf(0.00000001, 'Too many decimal places'),
  // Market price supplied by client or injected by market data service
  price: z.coerce.number().positive('Price must be positive'),
  notes: z.string().max(500).optional(),
});

export const tradeHistoryQuerySchema = z.object({
  symbol: z.string().toUpperCase().optional(),
  side: z.enum(['BUY', 'SELL']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type PlaceTradeInput = z.infer<typeof placeTradeSchema>;
export type TradeHistoryQuery = z.infer<typeof tradeHistoryQuerySchema>;
