import { z } from 'zod';

export const createTransactionSchema = z.object({
  name: z.string().min(1, 'Transaction name is required'),
  description: z.string().optional().nullable(),
  type: z.enum(['income', 'expense']).default('expense').optional(),
  amount: z.number().positive('Amount must be greater than zero'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  emotionalTrigger: z.enum(['Boredom', 'StressReward', 'FOMO', 'FlashSale', 'Need']).default('Need').optional(),
  isImpulse: z.boolean().default(false).optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

