import { z } from 'zod';

export const createAssetSnapshotSchema = z.object({
  name: z.string().optional().default('Net Worth Valuation'),
  description: z.string().optional().nullable(),
  snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Snapshot date must be YYYY-MM-DD'),
  totalNetWorth: z.number().min(0).optional(),
  totalCash: z.number().min(0).optional(),
  totalHard: z.number().min(0).optional(),
  totalInvestment: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
  itemsSnapshot: z.array(z.any()).optional().default([]),
  syncWithLiveAssets: z.boolean().optional().default(false),
});

export const updateAssetSnapshotSchema = createAssetSnapshotSchema.partial();

