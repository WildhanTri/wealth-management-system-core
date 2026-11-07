import { Request, Response } from 'express';
import { UserProfile, Asset, Transaction, PlannedExpense, QuarantineItem, AssetSnapshot, AppStat } from '../models/index.js';
import { computeFinancialHealth } from '../utils/financialEngine.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getFinancialOverview(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const baseWhere: any = { is_deleted: false };
    if (userId) baseWhere.user_id = userId;

    const profile = await UserProfile.findOne({ where: baseWhere });
    const assets = await Asset.findAll({ where: baseWhere });
    const transactions = await Transaction.findAll({ where: baseWhere });
    const plans = await PlannedExpense.findAll({ where: baseWhere });
    const quarantineItems = await QuarantineItem.findAll({ where: baseWhere });
    const snapshots = await AssetSnapshot.findAll({
      where: baseWhere,
      order: [['snapshot_date', 'ASC']],
    });

    const metrics = computeFinancialHealth(profile, assets, transactions);

    const savedStat = await AppStat.findOne({ where: { ...baseWhere, name: 'saved_money_total' } });
    const preventedStat = await AppStat.findOne({ where: { ...baseWhere, name: 'prevented_count' } });

    sendSuccess({
      res,
      message: 'Financial overview and health metrics calculated successfully',
      data: {
        profile,
        isOnboarded: profile ? profile.is_onboarded : false,
        metrics,
        summary: {
          totalAssetsCount: assets.length,
          totalTransactionsCount: transactions.length,
          activePlansCount: plans.filter((p) => p.status === 'active').length,
          activeQuarantineCount: quarantineItems.filter((q) => q.status === 'quarantined').length,
          snapshotsCount: snapshots.length,
          savedMoneyTotal: savedStat ? Number(savedStat.value) : 0,
          preventedDecisionsCount: preventedStat ? Number(preventedStat.value) : 0,
        },
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

