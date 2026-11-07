import { Request, Response } from 'express';
import { UserProfile, Asset, AssetSnapshot, Transaction, PlannedExpense, QuarantineItem } from '../models/index.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';

export async function getUserProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const where: any = { is_deleted: false };
    if (userId) where.user_id = userId;

    const profile = await UserProfile.findOne({
      where,
      order: [['created_at', 'ASC']],
    });

    sendSuccess({
      res,
      message: profile ? 'User profile retrieved successfully' : 'No user profile found',
      data: {
        profile: profile || null,
        isOnboarded: profile ? profile.is_onboarded : false,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function upsertUserProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const {
      name,
      description,
      industry,
      jobRole,
      age,
      monthlyIncome,
      isMarried,
      hasDependents,
      dependentsCount,
      monthlyInstallments,
      joinedAt,
      isOnboarded,
    } = req.body;

    const where: any = { is_deleted: false };
    if (userId) where.user_id = userId;

    let profile = await UserProfile.findOne({
      where,
      order: [['created_at', 'ASC']],
    });

    if (profile) {
      await profile.update({
        name,
        description,
        industry,
        job_role: jobRole,
        age,
        monthly_income: monthlyIncome,
        is_married: isMarried,
        has_dependents: hasDependents,
        dependents_count: dependentsCount,
        monthly_installments: monthlyInstallments,
        joined_at: joinedAt ? new Date(joinedAt) : profile.joined_at,
        is_onboarded: isOnboarded !== undefined ? isOnboarded : profile.is_onboarded,
        user_id: userId || profile.user_id,
        updated_by: userId || 'user',
      });
      sendSuccess({
        res,
        message: 'User profile updated successfully',
        data: profile,
      });
    } else {
      profile = await UserProfile.create({
        id: undefined as any,
        user_id: userId || null,
        name,
        description,
        industry,
        job_role: jobRole,
        age,
        monthly_income: monthlyIncome,
        is_married: isMarried,
        has_dependents: hasDependents,
        dependents_count: dependentsCount,
        monthly_installments: monthlyInstallments,
        joined_at: joinedAt ? new Date(joinedAt) : new Date(),
        is_onboarded: isOnboarded || false,
        created_by: userId || 'user',
        updated_by: userId || 'user',
        is_active: true,
        is_deleted: false,
      });
      sendCreated({
        res,
        message: 'User profile created successfully',
        data: profile,
      });
    }
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

/**
 * Handles completing the Onboarding Wizard in a single transaction:
 * Creates user profile, seeds initial assets, and logs baseline valuation snapshot.
 */
export async function completeOnboarding(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { profile: pData, initialAssets } = req.body;

    const where: any = { is_deleted: false };
    if (userId) where.user_id = userId;

    // Create or update profile
    let profile = await UserProfile.findOne({ where });
    if (profile) {
      await profile.update({
        name: pData.name,
        description: pData.description,
        industry: pData.industry,
        job_role: pData.jobRole,
        age: pData.age,
        monthly_income: pData.monthlyIncome,
        is_married: pData.isMarried,
        has_dependents: pData.hasDependents,
        dependents_count: pData.dependentsCount,
        monthly_installments: pData.monthlyInstallments,
        is_onboarded: true,
        user_id: userId || profile.user_id,
        updated_by: userId || 'onboarding_wizard',
      });
    } else {
      profile = await UserProfile.create({
        id: undefined as any,
        user_id: userId || null,
        name: pData.name,
        description: pData.description,
        industry: pData.industry,
        job_role: pData.jobRole,
        age: pData.age,
        monthly_income: pData.monthlyIncome,
        is_married: pData.isMarried,
        has_dependents: pData.hasDependents,
        dependents_count: pData.dependentsCount,
        monthly_installments: pData.monthlyInstallments,
        joined_at: pData.joinedAt ? new Date(pData.joinedAt) : new Date(),
        is_onboarded: true,
        created_by: userId || 'onboarding_wizard',
        updated_by: userId || 'onboarding_wizard',
        is_active: true,
        is_deleted: false,
      });
    }

    // Insert initial assets
    const createdAssets: Asset[] = [];
    if (Array.isArray(initialAssets) && initialAssets.length > 0) {
      for (const item of initialAssets) {
        const created = await Asset.create({
          id: undefined as any,
          user_id: userId || null,
          name: item.name,
          description: item.description,
          asset_class: item.assetClass,
          type: item.type,
          estimated_value: item.estimatedValue,
          liquidity_tier: item.liquidityTier || 'instant_liquid',
          risk_level: item.riskLevel || 'low',
          created_by: userId || 'onboarding_wizard',
          updated_by: userId || 'onboarding_wizard',
          is_active: true,
          is_deleted: false,
        });
        createdAssets.push(created);
      }
    }

    // Log baseline snapshot
    let baselineSnapshot: AssetSnapshot | null = null;
    if (createdAssets.length > 0) {
      let cash = 0;
      let hard = 0;
      let inv = 0;

      for (const a of createdAssets) {
        const v = Number(a.estimated_value);
        if (a.asset_class === 'cash_equivalent') cash += v;
        else if (a.asset_class === 'hard_asset_movable' || a.asset_class === 'hard_asset_immovable') hard += v;
        else if (a.asset_class === 'investment') inv += v;
      }

      baselineSnapshot = await AssetSnapshot.create({
        id: undefined as any,
        user_id: userId || null,
        name: 'Initial Baseline Valuation (Onboarding)',
        description: 'First asset snapshot recorded during setup wizard',
        snapshot_date: new Date().toISOString().split('T')[0],
        total_net_worth: cash + hard + inv,
        total_cash: cash,
        total_hard: hard,
        total_investment: inv,
        notes: 'Initial Baseline Valuation (Onboarding)',
        items_snapshot: createdAssets.map((a) => a.toJSON()),
        created_by: userId || 'onboarding_wizard',
        updated_by: userId || 'onboarding_wizard',
        is_active: true,
        is_deleted: false,
      });
    }

    sendSuccess({
      res,
      message: 'Onboarding completed successfully',
      data: {
        profile,
        assets: createdAssets,
        baselineSnapshot,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

/**
 * Resets user portfolio: soft-deletes assets, transactions, plans, quarantine, snapshots,
 * and sets profile is_onboarded to false.
 */
export async function resetUserData(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const where: any = { is_deleted: false };
    if (userId) where.user_id = userId;

    await Promise.all([
      Asset.update({ is_deleted: true, is_active: false, updated_by: userId || 'user_reset' }, { where }),
      Transaction.update({ is_deleted: true, is_active: false, updated_by: userId || 'user_reset' }, { where }),
      PlannedExpense.update({ is_deleted: true, is_active: false, updated_by: userId || 'user_reset' }, { where }),
      QuarantineItem.update({ is_deleted: true, is_active: false, updated_by: userId || 'user_reset' }, { where }),
      AssetSnapshot.update({ is_deleted: true, is_active: false, updated_by: userId || 'user_reset' }, { where }),
    ]);

    const profile = await UserProfile.findOne({ where: { ...(userId ? { user_id: userId } : {}), is_deleted: false } });
    if (profile) {
      await profile.update({ is_onboarded: false, updated_by: userId || 'user_reset' });
    }

    sendSuccess({
      res,
      message: 'User portfolio data reset successfully. Ready for fresh onboarding.',
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

