import { DrawStrategy } from '@prisma/client';
import { z } from 'zod';

export const createDrawSchema = z.object({
  month: z.number().int().min(1, 'Month must be between 1 and 12').max(12, 'Month must be between 1 and 12'),
  year: z.number().int().min(2026, 'Year must be 2026 or later'),
  strategy: z.nativeEnum(DrawStrategy, {
    errorMap: () => ({ message: 'Invalid strategy. Must be RANDOM or SCORE_WEIGHTED' }),
  }),
});

export type CreateDrawInput = z.infer<typeof createDrawSchema>;
