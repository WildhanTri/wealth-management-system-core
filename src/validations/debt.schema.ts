import { z } from 'zod';

export const createDebtSchema = z.object({
  name: z.string().min(1, 'Debt title is required'),
  category: z
    .enum([
      'credit_card',
      'personal_loan',
      'mortgage',
      'vehicle_loan',
      'peer_loan',
      'paylater',
      'other',
    ])
    .default('other'),
  lender: z.string().optional().nullable(),
  totalAmount: z.number().positive('Total debt amount must be greater than zero'),
  remainingAmount: z.number().min(0, 'Remaining debt amount cannot be negative'),
  monthlyPayment: z.number().min(0).optional().nullable(),
  interestRate: z.number().min(0).optional().nullable(),
  deadlineDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline date must be in YYYY-MM-DD format'),
  status: z.enum(['active', 'paid_off', 'paused']).default('active'),
  notes: z.string().optional().nullable(),
});

export const updateDebtSchema = createDebtSchema.partial();

export const recordDebtPaymentSchema = z.object({
  paymentAmount: z.number().positive('Payment amount must be greater than zero'),
  notes: z.string().optional().nullable(),
});

