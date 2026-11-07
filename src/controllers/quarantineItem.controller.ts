import { Request, Response } from 'express';
import { QuarantineItem, UserProfile, AppStat, Transaction } from '../models/index.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';

export async function listQuarantineItems(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { status, urgency } = req.query;
    const where: any = { is_deleted: false };

    if (userId) where.user_id = userId;
    if (status) where.status = status;
    if (urgency) where.urgency = urgency;

    const items = await QuarantineItem.findAll({
      where,
      order: [['created_at', 'DESC']],
    });

    const activeQuarantined = items.filter((i) => i.status === 'quarantined');
    const totalQuarantinedValue = activeQuarantined.reduce((sum, i) => sum + Number(i.price), 0);

    // Retrieve saved money stat scoped to user if applicable
    const statWhere: any = { is_deleted: false };
    if (userId) statWhere.user_id = userId;

    const savedStat = await AppStat.findOne({ where: { ...statWhere, name: 'saved_money_total' } });
    const preventedStat = await AppStat.findOne({ where: { ...statWhere, name: 'prevented_count' } });

    sendSuccess({
      res,
      message: 'Quarantine items retrieved successfully',
      data: items,
      meta: {
        totalItems: items.length,
        activeCount: activeQuarantined.length,
        totalQuarantinedValue,
        savedMoneyTotal: savedStat ? Number(savedStat.value) : 0,
        preventedCount: preventedStat ? Number(preventedStat.value) : 0,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function createQuarantineItem(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { name, description, price, category, urgency } = req.body;

    // Fetch user profile to compute Life Energy work hours and S2S impact
    const profileWhere: any = { is_deleted: false };
    if (userId) profileWhere.user_id = userId;
    const profile = await UserProfile.findOne({ where: profileWhere });
    const monthlyIncome = profile ? Number(profile.monthly_income) : 0;
    const hourlyWage = monthlyIncome > 0 ? Math.round(monthlyIncome / 160) : 0;
    const workHoursCost = hourlyWage > 0 ? Math.round((Number(price) / hourlyWage) * 10) / 10 : 0;

    // 48 hours quarantine by default
    const quarantineUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const item = await QuarantineItem.create({
      id: undefined as any,
      user_id: userId || null,
      name,
      description,
      price,
      category,
      urgency: urgency || 'wants',
      quarantine_until: quarantineUntil,
      work_hours_cost: workHoursCost,
      daily_s2s_impact: 0,
      status: 'quarantined',
      created_by: userId || 'smart_buddy',
      updated_by: userId || 'smart_buddy',
      is_active: true,
      is_deleted: false,
    });

    sendCreated({
      res,
      message: 'Item entered 48-Hour Cooling Quarantine successfully',
      data: item,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function resolveQuarantineItem(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { resolution } = req.body; // 'purchased' | 'prevented'

    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const item = await QuarantineItem.findOne({ where });

    if (!item) {
      sendError({ res, statusCode: 404, message: 'Quarantine item not found' });
      return;
    }

    if (resolution === 'purchased') {
      // Mark as purchased and record expense in transactions
      await item.update({
        status: 'purchased',
        updated_by: userId || 'user_resolution',
      });

      await Transaction.create({
        id: undefined as any,
        user_id: userId || null,
        name: item.name,
        description: `Purchased after cooling period from SmartBuddy Decision Lab`,
        amount: item.price,
        category: item.category,
        date: new Date().toISOString().split('T')[0],
        emotional_trigger: 'Need',
        is_impulse: false,
        created_by: userId || 'quarantine_resolver',
        updated_by: userId || 'quarantine_resolver',
        is_active: true,
        is_deleted: false,
      });

      sendSuccess({
        res,
        message: 'Item marked as purchased and recorded into cash flow ledger',
        data: item,
      });
    } else {
      // Mark as prevented and increment Impulsive Guard Jar savings
      await item.update({
        status: 'prevented',
        updated_by: userId || 'user_resolution',
      });

      // Update or create saved_money_total stat
      const statWhere: any = { name: 'saved_money_total' };
      if (userId) statWhere.user_id = userId;

      const [savedStat] = await AppStat.findOrCreate({
        where: statWhere,
        defaults: {
          id: undefined as any,
          user_id: userId || null,
          name: 'saved_money_total',
          description: 'Total impulsive spending averted',
          value: 0,
          created_by: userId || 'system',
          updated_by: userId || 'system',
          is_active: true,
          is_deleted: false,
        },
      });
      await savedStat.update({
        value: Number(savedStat.value) + Number(item.price),
        updated_by: userId || 'quarantine_resolver',
      });

      // Update or create prevented_count stat
      const preventedWhere: any = { name: 'prevented_count' };
      if (userId) preventedWhere.user_id = userId;

      const [preventedStat] = await AppStat.findOrCreate({
        where: preventedWhere,
        defaults: {
          id: undefined as any,
          user_id: userId || null,
          name: 'prevented_count',
          description: 'Total impulsive purchase decisions prevented',
          value: 0,
          created_by: userId || 'system',
          updated_by: userId || 'system',
          is_active: true,
          is_deleted: false,
        },
      });
      await preventedStat.update({
        value: Number(preventedStat.value) + 1,
        updated_by: userId || 'quarantine_resolver',
      });

      sendSuccess({
        res,
        message: 'Impulsive purchase successfully averted! Added to Impulsive Guard Jar',
        data: {
          item,
          totalSavedMoney: Number(savedStat.value),
          totalPreventedCount: Number(preventedStat.value),
        },
      });
    }
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function deleteQuarantineItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const item = await QuarantineItem.findOne({ where });

    if (!item) {
      sendError({ res, statusCode: 404, message: 'Quarantine item not found' });
      return;
    }

    await item.update({
      is_deleted: true,
      is_active: false,
      updated_by: userId || 'user',
    });

    sendSuccess({
      res,
      message: 'Quarantine item deleted successfully',
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}
