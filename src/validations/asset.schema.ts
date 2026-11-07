import { z } from 'zod';

export const createAssetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  description: z.string().optional().nullable(),
  assetClass: z.enum([
    'cash_equivalent',
    'hard_asset_movable',
    'hard_asset_immovable',
    'investment',
  ]),
  type: z.string().min(1, 'Asset type / instrument is required'),
  estimatedValue: z.number().min(0, 'Estimated value cannot be negative'),
  liquidityTier: z.enum(['instant_liquid', 'marketable_semi_liquid', 'illiquid']).default('instant_liquid'),
  riskLevel: z.enum(['very_low', 'low', 'medium', 'high']).default('low'),
  appreciationType: z.enum(['appreciating', 'depreciating']).optional().nullable(),
  displayOrder: z.number().optional().nullable(),
});

export const updateAssetSchema = createAssetSchema.partial();

export const reorderAssetsSchema = z.object({
  assetIds: z.array(z.string()).min(1, 'Asset IDs array is required'),
});

