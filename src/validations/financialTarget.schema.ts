import { z } from 'zod';

export const createFinancialTargetSchema = z.object({
  name: z.string().min(1, 'Target name is required'),
  targetType: z.enum(['needs', 'wants']).default('needs'),
  timeframe: z.enum(['short_term', 'long_term']).default('short_term'),
  category: z.string().min(1).default('other_needs_short'),
  targetAmount: z.number().positive('Target amount must be greater than zero'),
  currentAmount: z.number().min(0, 'Current allocated amount must be non-negative').default(0),
  deadlineDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline date must be in YYYY-MM-DD format'),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  status: z.enum(['in_progress', 'completed', 'paused']).default('in_progress'),
  notes: z.string().optional().nullable(),
});

export const updateFinancialTargetSchema = createFinancialTargetSchema.partial();

export const allocateTargetFundsSchema = z.object({
  additionalAmount: z.number().positive('Allocated amount must be greater than zero'),
});

