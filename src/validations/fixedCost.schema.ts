import { z } from 'zod';

export const createFixedCostSchema = z.object({
  name: z.string().min(1, 'Fixed cost title is required'),
  category: z
    .enum([
      'utilities',
      'subscriptions',
      'housing',
      'insurance',
      'memberships',
      'debt_installments',
      'telecom',
      'other',
    ])
    .default('utilities'),
  amount: z.number().positive('Amount must be greater than zero'),
  dueDay: z.number().int().min(1).max(31).default(1),
  notes: z.string().optional().nullable(),
});

export const updateFixedCostSchema = createFixedCostSchema.partial();

export const togglePaidFixedCostSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, 'monthYear must be in format YYYY-MM (e.g. 2026-11)'),
  isPaid: z.boolean().optional(),
  paidAmount: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
});

