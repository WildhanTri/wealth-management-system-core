import { z } from 'zod';

export const createQuarantineItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional().nullable(),
  price: z.number().positive('Price must be greater than zero'),
  category: z.string().min(1, 'Category is required'),
  urgency: z.enum(['wants', 'productive', 'emergency']).default('wants'),
  quarantineUntil: z.union([z.string(), z.number(), z.date()]).optional(),
  workHoursCost: z.number().min(0).optional(),
  dailyS2SImpact: z.number().min(0).optional(),
  status: z.enum(['quarantined', 'purchased', 'prevented']).default('quarantined'),
});

export const resolveQuarantineSchema = z.object({
  resolution: z.enum(['purchased', 'prevented']),
});

