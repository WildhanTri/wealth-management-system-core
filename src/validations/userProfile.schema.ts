import { z } from 'zod';

export const userProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  jobRole: z.string().optional().nullable(),
  age: z.number().int().min(10).max(120).default(25),
  monthlyIncome: z.number().min(0).default(0),
  isMarried: z.boolean().default(false),
  hasDependents: z.boolean().default(false),
  dependentsCount: z.number().int().min(0).default(0),
  monthlyInstallments: z.number().min(0).default(0),
  joinedAt: z.union([z.string(), z.number(), z.date()]).optional(),
  isOnboarded: z.boolean().default(false),
});

export const onboardingSetupSchema = z.object({
  profile: userProfileSchema,
  initialAssets: z.array(
    z.object({
      name: z.string().min(1, 'Asset name is required'),
      assetClass: z.enum([
        'cash_equivalent',
        'hard_asset_movable',
        'hard_asset_immovable',
        'investment',
      ]),
      type: z.string().min(1, 'Asset type is required'),
      estimatedValue: z.number().min(0),
      liquidityTier: z.enum(['instant_liquid', 'marketable_semi_liquid', 'illiquid']).default('instant_liquid'),
      riskLevel: z.enum(['very_low', 'low', 'medium', 'high']).default('low'),
    })
  ).optional().default([]),
});

