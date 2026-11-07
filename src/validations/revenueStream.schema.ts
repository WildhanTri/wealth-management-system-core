import { z } from 'zod';

export const createRevenueStreamSchema = z.object({
  name: z.string().min(1, 'Revenue stream name is required'),
  category: z.enum(['main_job', 'side_hustle', 'passive_income', 'other']).default('main_job'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  frequency: z.enum(['monthly', 'weekly', 'biweekly', 'irregular']).default('monthly'),
  status: z.enum(['active', 'inactive']).default('active'),
  notes: z.string().optional().nullable(),
});

export const updateRevenueStreamSchema = createRevenueStreamSchema.partial();

