import { z } from 'zod';

// Optional price map: { "AAPL": 182.50, "TSLA": 240.00 }
export const pricesQuerySchema = z.object({
  prices: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return {};
      try {
        const parsed = JSON.parse(val);
        return z.record(z.number().positive()).parse(parsed);
      } catch {
        return {};
      }
    }),
});

export type PricesQuery = z.infer<typeof pricesQuerySchema>;
