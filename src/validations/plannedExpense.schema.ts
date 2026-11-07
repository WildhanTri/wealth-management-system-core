import { z } from 'zod';

export const createPlannedExpenseSchema = z.object({
  name: z.string().min(1, 'Title or goal name is required'),
  description: z.string().optional().nullable(),
  targetAmount: z.number().positive('Target budget must be greater than zero'),
  currentAmount: z.number().min(0).default(0),
  category: z.string().min(1, 'Category is required'),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be in YYYY-MM-DD format'),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  status: z.enum(['active', 'completed', 'cancelled']).default('active'),
  notes: z.string().optional().nullable(),
});

export const updatePlannedExpenseSchema = createPlannedExpenseSchema.partial();

export const allocateFundsSchema = z.object({
  additionalAmount: z.number().positive('Allocated amount must be greater than zero'),
});

