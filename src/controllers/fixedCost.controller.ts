import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { FixedCost } from '../models/FixedCost.js';
import { FixedCostPayment } from '../models/FixedCostPayment.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';

function getCurrentMonthYear(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function listFixedCosts(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const monthYear = (req.query.month as string) || getCurrentMonthYear();
    const { category } = req.query;

    const where: any = { is_deleted: false };
    if (userId) where.user_id = userId;
    if (category) where.category = category;

    const costs = await FixedCost.findAll({
      where,
      order: [
        ['display_order', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });

    // Fetch payments for this specific month
    const payments = await FixedCostPayment.findAll({
      where: {
        is_deleted: false,
        month_year: monthYear,
        ...(userId && { user_id: userId }),
      },
    });

    const paymentMap = new Map<string, FixedCostPayment>();
    payments.forEach((p) => {
      paymentMap.set(p.fixed_cost_id, p);
    });

    let totalObligation = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let paidCount = 0;
    let pendingCount = 0;

    // Filter applicable costs for the queried monthYear
    const applicableCosts = costs.filter((c) => {
      const start = (c as any).start_month;
      const end = (c as any).end_month;
      if (start && start > monthYear) return false;
      if (end && end < monthYear) return false;
      return true;
    });

    const items = applicableCosts.map((c) => {
      const amt = Number(c.amount) || 0;
      totalObligation += amt;

      const payment = paymentMap.get(c.id);
      const isPaid = payment ? payment.is_paid : false;
      const paidAmount = payment ? Number(payment.paid_amount) : 0;
      const paidAt = payment ? payment.paid_at : null;

      if (isPaid) {
        totalPaid += paidAmount > 0 ? paidAmount : amt;
        paidCount++;
      } else {
        totalPending += amt;
        pendingCount++;
      }

      return {
        ...c.toJSON(),
        startMonth: (c as any).start_month ?? null,
        endMonth: (c as any).end_month ?? null,
        currentMonth: monthYear,
        isPaid,
        paidAmount,
        paidAt,
        paymentNotes: payment ? payment.notes : null,
      };
    });

    const completionRate = totalObligation > 0 ? Math.round((totalPaid / totalObligation) * 100) : 0;

    sendSuccess({
      res,
      message: 'Fixed costs retrieved successfully',
      data: items,
      meta: {
        monthYear,
        totalItems: items.length,
        totalObligation,
        totalPaid,
        totalPending,
        paidCount,
        pendingCount,
        completionRate,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function createFixedCost(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { name, category, amount, dueDay, notes, startMonth, endMonth } = req.body;

    const cost = await FixedCost.create({
      id: undefined as any,
      user_id: userId,
      name,
      category: category || 'utilities',
      amount: Number(amount) || 0,
      due_day: Number(dueDay) || 1,
      notes,
      start_month: startMonth || null,
      end_month: endMonth || null,
      created_by: userId || 'system',
      updated_by: userId || 'system',
      is_active: true,
      is_deleted: false,
    });

    sendCreated({
      res,
      message: 'Fixed cost item created successfully',
      data: {
        ...cost.toJSON(),
        startMonth: cost.start_month ?? null,
        endMonth: cost.end_month ?? null,
        amount: Number(cost.amount) || 0,
        dueDay: cost.due_day,
        isPaid: false,
        paidAmount: 0,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function updateFixedCost(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const cost = await FixedCost.findOne({ where });
    if (!cost) {
      sendError({ res, statusCode: 404, message: 'Fixed cost not found' });
      return;
    }

    const { name, category, amount, dueDay, notes, startMonth, endMonth } = req.body;
    await cost.update({
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(dueDay !== undefined && { due_day: Number(dueDay) }),
      ...(notes !== undefined && { notes }),
      ...(startMonth !== undefined && { start_month: startMonth }),
      ...(endMonth !== undefined && { end_month: endMonth }),
      updated_by: userId || 'system',
    });

    sendSuccess({
      res,
      message: 'Fixed cost updated successfully',
      data: {
        ...cost.toJSON(),
        startMonth: cost.start_month ?? null,
        endMonth: cost.end_month ?? null,
        amount: Number(cost.amount) || 0,
        dueDay: cost.due_day,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function deleteFixedCost(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const cost = await FixedCost.findOne({ where });
    if (!cost) {
      sendError({ res, statusCode: 404, message: 'Fixed cost not found' });
      return;
    }

    await cost.update({
      is_deleted: true,
      updated_by: userId || 'system',
    });

    sendSuccess({
      res,
      message: 'Fixed cost deleted successfully',
      data: { id },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function toggleFixedCostPaid(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { monthYear, isPaid, paidAmount, notes } = req.body;

    const effectiveMonthYear = monthYear || getCurrentMonthYear();

    const cost = await FixedCost.findOne({
      where: { id, is_deleted: false, ...(userId && { user_id: userId }) },
    });

    if (!cost) {
      sendError({ res, statusCode: 404, message: 'Fixed cost not found' });
      return;
    }

    const fixedCostId = String(id);
    const [payment, created] = await FixedCostPayment.findOrCreate({
      where: {
        fixed_cost_id: fixedCostId,
        month_year: effectiveMonthYear,
        is_deleted: false,
      } as any,
      defaults: {
        id: undefined as any,
        fixed_cost_id: fixedCostId,
        user_id: userId || null,
        month_year: effectiveMonthYear,
        is_paid: true,
        paid_amount: Number(paidAmount ?? cost.amount) || 0,
        paid_at: new Date(),
        notes,
        created_by: userId || 'system',
        updated_by: userId || 'system',
        is_active: true,
        is_deleted: false,
      },
    });

    if (!created) {
      const nextIsPaid = isPaid !== undefined ? isPaid : !payment.is_paid;
      await payment.update({
        is_paid: nextIsPaid,
        paid_amount: nextIsPaid ? Number(paidAmount ?? cost.amount) || 0 : 0,
        paid_at: nextIsPaid ? new Date() : null,
        notes: notes !== undefined ? notes : payment.notes,
        updated_by: userId || 'system',
      });
    }

    sendSuccess({
      res,
      message: `Fixed cost marked as ${payment.is_paid ? 'PAID' : 'PENDING'} for ${effectiveMonthYear}`,
      data: payment,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function getFixedCostHistory(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const monthsParam = req.query.months ? String(req.query.months).toLowerCase().trim() : '6';

    const now = new Date();
    const months: string[] = [];

    const costs = await FixedCost.findAll({
      where: { is_deleted: false, ...(userId && { user_id: userId }) },
    });

    if (monthsParam === 'all') {
      const earliestPayment = await FixedCostPayment.findOne({
        where: { is_deleted: false, ...(userId && { user_id: userId }) },
        order: [['month_year', 'ASC']],
      });

      let startYear = now.getFullYear();
      let startMonth = now.getMonth();

      if (earliestPayment?.month_year) {
        const [pY, pM] = earliestPayment.month_year.split('-').map(Number);
        if (pY && pM) {
          if (pY < startYear || (pY === startYear && pM - 1 < startMonth)) {
            startYear = pY;
            startMonth = pM - 1;
          }
        }
      }

      // Also check costs start_month
      for (const c of costs) {
        const sMonth = (c as any).start_month;
        if (sMonth) {
          const [cY, cM] = sMonth.split('-').map(Number);
          if (cY && cM) {
            if (cY < startYear || (cY === startYear && cM - 1 < startMonth)) {
              startYear = cY;
              startMonth = cM - 1;
            }
          }
        }
      }

      const totalDiff = (now.getFullYear() - startYear) * 12 + (now.getMonth() - startMonth);
      const effectiveCount = Math.max(totalDiff + 1, 6);

      for (let i = effectiveCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        months.push(`${y}-${m}`);
      }
    } else {
      const count = monthsParam === '1y' || monthsParam === '12' ? 12 : Math.max(1, parseInt(monthsParam, 10) || 6);
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        months.push(`${y}-${m}`);
      }
    }

    const payments = await FixedCostPayment.findAll({
      where: {
        is_deleted: false,
        month_year: { [Op.in]: months },
        ...(userId && { user_id: userId }),
      },
    });

    const history = months.map((m) => {
      const applicableForMonth = costs.filter((c) => {
        const start = (c as any).start_month;
        const end = (c as any).end_month;
        if (start && start > m) return false;
        if (end && end < m) return false;
        return true;
      });
      const monthObligation = applicableForMonth.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

      const mPayments = payments.filter((p) => p.month_year === m && p.is_paid);
      const paidTotal = mPayments.reduce((acc, p) => acc + (Number(p.paid_amount) || 0), 0);
      const paidBillsCount = mPayments.length;

      return {
        monthYear: m,
        totalObligation: monthObligation,
        totalPaid: paidTotal,
        totalPending: Math.max(0, monthObligation - paidTotal),
        paidCount: paidBillsCount,
        totalBills: applicableForMonth.length,
      };
    });

    sendSuccess({
      res,
      message: 'Fixed cost history retrieved successfully',
      data: history,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function reorderFixedCosts(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { costIds } = req.body;

    if (Array.isArray(costIds) && costIds.length > 0) {
      await Promise.all(
        costIds.map((id: string, index: number) =>
          FixedCost.update(
            { display_order: index },
            {
              where: {
                id,
                ...(userId ? { user_id: userId } : {}),
                is_deleted: false,
              },
            }
          )
        )
      );
    }

    sendSuccess({
      res,
      message: 'Fixed costs reordered successfully',
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}
