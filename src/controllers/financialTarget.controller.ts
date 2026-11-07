import { Request, Response } from 'express';
import { FinancialTarget } from '../models/FinancialTarget.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';

function calculateMonthsRemaining(deadlineStr: string): number {
  const now = new Date();
  const deadline = new Date(deadlineStr);

  let months = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
  if (deadline.getDate() > now.getDate()) {
    months += 1;
  }
  return Math.max(1, months);
}

export async function listFinancialTargets(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { category, priority, status } = req.query;

    const where: any = { is_deleted: false };
    if (userId) where.user_id = userId;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (status) where.status = status;

    const targets = await FinancialTarget.findAll({
      where,
      order: [
        ['display_order', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });

    let totalTargetAmount = 0;
    let totalAllocatedAmount = 0;
    let totalRemainingAmount = 0;
    let totalMonthlyRequired = 0;

    const items = targets.map((t) => {
      const targetAmt = Number(t.target_amount) || 0;
      const currentAmt = Number(t.current_amount) || 0;
      const remainingAmt = Math.max(0, targetAmt - currentAmt);
      const remainingMonths = calculateMonthsRemaining(t.deadline_date);
      const monthlyReq = t.status === 'completed' ? 0 : Math.ceil(remainingAmt / remainingMonths);
      const progressPercent = targetAmt > 0 ? Math.min(100, Math.round((currentAmt / targetAmt) * 100)) : 0;

      totalTargetAmount += targetAmt;
      totalAllocatedAmount += currentAmt;
      totalRemainingAmount += remainingAmt;
      if (t.status === 'in_progress') {
        totalMonthlyRequired += monthlyReq;
      }

      return {
        ...t.toJSON(),
        remainingAmount: remainingAmt,
        remainingMonths,
        monthlyRequired: monthlyReq,
        progressPercent,
      };
    });

    const overallProgress =
      totalTargetAmount > 0 ? Math.round((totalAllocatedAmount / totalTargetAmount) * 100) : 0;

    sendSuccess({
      res,
      message: 'Financial targets retrieved successfully',
      data: items,
      meta: {
        totalTargets: items.length,
        totalTargetAmount,
        totalAllocatedAmount,
        totalRemainingAmount,
        totalMonthlyRequired,
        overallProgress,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function getFinancialTargetById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const target = await FinancialTarget.findOne({ where });
    if (!target) {
      sendError({ res, statusCode: 404, message: 'Financial target not found' });
      return;
    }

    const targetAmt = Number(target.target_amount) || 0;
    const currentAmt = Number(target.current_amount) || 0;
    const remainingAmt = Math.max(0, targetAmt - currentAmt);
    const remainingMonths = calculateMonthsRemaining(target.deadline_date);
    const monthlyReq = target.status === 'completed' ? 0 : Math.ceil(remainingAmt / remainingMonths);
    const progressPercent = targetAmt > 0 ? Math.min(100, Math.round((currentAmt / targetAmt) * 100)) : 0;

    sendSuccess({
      res,
      message: 'Financial target retrieved successfully',
      data: {
        ...target.toJSON(),
        remainingAmount: remainingAmt,
        remainingMonths,
        monthlyRequired: monthlyReq,
        progressPercent,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function createFinancialTarget(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { name, category, targetAmount, currentAmount, deadlineDate, priority, status, notes } = req.body;

    const target = await FinancialTarget.create({
      id: undefined as any,
      user_id: userId,
      name,
      category: category || 'emergency_fund',
      target_amount: Number(targetAmount) || 0,
      current_amount: Number(currentAmount) || 0,
      deadline_date: deadlineDate,
      priority: priority || 'medium',
      status: status || 'in_progress',
      notes,
      created_by: userId || 'system',
      updated_by: userId || 'system',
      is_active: true,
      is_deleted: false,
    });

    const targetAmt = Number(target.target_amount) || 0;
    const currentAmt = Number(target.current_amount) || 0;
    const remainingAmt = Math.max(0, targetAmt - currentAmt);
    const remainingMonths = calculateMonthsRemaining(target.deadline_date);
    const monthlyReq = target.status === 'completed' ? 0 : Math.ceil(remainingAmt / remainingMonths);
    const progressPercent = targetAmt > 0 ? Math.min(100, Math.round((currentAmt / targetAmt) * 100)) : 0;

    sendCreated({
      res,
      message: 'Financial target created successfully',
      data: {
        ...target.toJSON(),
        targetAmount: targetAmt,
        currentAmount: currentAmt,
        remainingAmount: remainingAmt,
        remainingMonths,
        monthlyRequired: monthlyReq,
        progressPercent,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function updateFinancialTarget(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const target = await FinancialTarget.findOne({ where });
    if (!target) {
      sendError({ res, statusCode: 404, message: 'Financial target not found' });
      return;
    }

    const { name, category, targetAmount, currentAmount, deadlineDate, priority, status, notes } = req.body;
    await target.update({
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(targetAmount !== undefined && { target_amount: Number(targetAmount) }),
      ...(currentAmount !== undefined && { current_amount: Number(currentAmount) }),
      ...(deadlineDate !== undefined && { deadline_date: deadlineDate }),
      ...(priority !== undefined && { priority }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      updated_by: userId || 'system',
    });

    const targetAmt = Number(target.target_amount) || 0;
    const currentAmt = Number(target.current_amount) || 0;
    const remainingAmt = Math.max(0, targetAmt - currentAmt);
    const remainingMonths = calculateMonthsRemaining(target.deadline_date);
    const monthlyReq = target.status === 'completed' ? 0 : Math.ceil(remainingAmt / remainingMonths);
    const progressPercent = targetAmt > 0 ? Math.min(100, Math.round((currentAmt / targetAmt) * 100)) : 0;

    sendSuccess({
      res,
      message: 'Financial target updated successfully',
      data: {
        ...target.toJSON(),
        targetAmount: targetAmt,
        currentAmount: currentAmt,
        remainingAmount: remainingAmt,
        remainingMonths,
        monthlyRequired: monthlyReq,
        progressPercent,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function deleteFinancialTarget(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const target = await FinancialTarget.findOne({ where });
    if (!target) {
      sendError({ res, statusCode: 404, message: 'Financial target not found' });
      return;
    }

    await target.update({
      is_deleted: true,
      updated_by: userId || 'system',
    });

    sendSuccess({
      res,
      message: 'Financial target deleted successfully',
      data: { id },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function allocateFundsToTarget(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { additionalAmount } = req.body;

    const target = await FinancialTarget.findOne({
      where: { id, is_deleted: false, ...(userId && { user_id: userId }) },
    });

    if (!target) {
      sendError({ res, statusCode: 404, message: 'Financial target not found' });
      return;
    }

    const newAmount = Number(target.current_amount) + Number(additionalAmount);
    const isCompleted = newAmount >= Number(target.target_amount);

    await target.update({
      current_amount: newAmount,
      ...(isCompleted && { status: 'completed' }),
      updated_by: userId || 'system',
    });

    sendSuccess({
      res,
      message: `Successfully allocated Rp ${Number(additionalAmount).toLocaleString('id-ID')} to ${target.name}`,
      data: target,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function reorderFinancialTargets(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { targetIds } = req.body;

    if (Array.isArray(targetIds) && targetIds.length > 0) {
      await Promise.all(
        targetIds.map((id: string, index: number) =>
          FinancialTarget.update(
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
      message: 'Financial targets reordered successfully',
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}
