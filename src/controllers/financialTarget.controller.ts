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

export function inferTargetClassification(
  category: string,
  existingType?: string,
  existingTimeframe?: string
): { targetType: 'needs' | 'wants'; timeframe: 'short_term' | 'long_term' } {
  if (existingType && existingTimeframe) {
    return {
      targetType: existingType as 'needs' | 'wants',
      timeframe: existingTimeframe as 'short_term' | 'long_term',
    };
  }

  // Check known short-term needs
  if (
    [
      'vehicle_maintenance',
      'home_maintenance',
      'medical_health',
      'tax_bill',
      'other_needs_short',
    ].includes(category)
  ) {
    return { targetType: 'needs', timeframe: 'short_term' };
  }
  // Check known long-term needs
  if (
    [
      'property',
      'emergency_fund',
      'education',
      'retirement',
      'other_needs_long',
    ].includes(category)
  ) {
    return { targetType: 'needs', timeframe: 'long_term' };
  }
  // Check known short-term wants
  if (
    [
      'gadget',
      'shopping',
      'entertainment',
      'hobby',
      'other_wants_short',
    ].includes(category)
  ) {
    return { targetType: 'wants', timeframe: 'short_term' };
  }
  // Check known long-term wants
  if (
    [
      'travel',
      'vehicle',
      'wedding',
      'investment',
      'other_wants_long',
    ].includes(category)
  ) {
    return { targetType: 'wants', timeframe: 'long_term' };
  }

  return {
    targetType: (existingType as any) || 'needs',
    timeframe: (existingTimeframe as any) || 'short_term',
  };
}

export async function listFinancialTargets(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { category, priority, status, targetType, timeframe } = req.query;

    const where: any = { is_deleted: false };
    if (userId) where.user_id = userId;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (status) where.status = status;
    if (targetType) where.target_type = targetType;
    if (timeframe) where.timeframe = timeframe;

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

    let needsTotalTarget = 0;
    let needsTotalAllocated = 0;
    let needsShortTermTarget = 0;
    let needsShortTermAllocated = 0;
    let needsLongTermTarget = 0;
    let needsLongTermAllocated = 0;

    let wantsTotalTarget = 0;
    let wantsTotalAllocated = 0;
    let wantsShortTermTarget = 0;
    let wantsShortTermAllocated = 0;
    let wantsLongTermTarget = 0;
    let wantsLongTermAllocated = 0;

    const items = targets.map((t) => {
      const targetAmt = Number(t.target_amount) || 0;
      const currentAmt = Number(t.current_amount) || 0;
      const remainingAmt = Math.max(0, targetAmt - currentAmt);
      const remainingMonths = calculateMonthsRemaining(t.deadline_date);
      const monthlyReq = t.status === 'completed' ? 0 : Math.ceil(remainingAmt / remainingMonths);
      const progressPercent = targetAmt > 0 ? Math.min(100, Math.round((currentAmt / targetAmt) * 100)) : 0;

      const classification = inferTargetClassification(
        t.category,
        (t as any).target_type,
        (t as any).timeframe
      );

      totalTargetAmount += targetAmt;
      totalAllocatedAmount += currentAmt;
      totalRemainingAmount += remainingAmt;
      if (t.status === 'in_progress') {
        totalMonthlyRequired += monthlyReq;
      }

      if (classification.targetType === 'needs') {
        needsTotalTarget += targetAmt;
        needsTotalAllocated += currentAmt;
        if (classification.timeframe === 'short_term') {
          needsShortTermTarget += targetAmt;
          needsShortTermAllocated += currentAmt;
        } else {
          needsLongTermTarget += targetAmt;
          needsLongTermAllocated += currentAmt;
        }
      } else {
        wantsTotalTarget += targetAmt;
        wantsTotalAllocated += currentAmt;
        if (classification.timeframe === 'short_term') {
          wantsShortTermTarget += targetAmt;
          wantsShortTermAllocated += currentAmt;
        } else {
          wantsLongTermTarget += targetAmt;
          wantsLongTermAllocated += currentAmt;
        }
      }

      return {
        ...t.toJSON(),
        targetType: classification.targetType,
        timeframe: classification.timeframe,
        targetAmount: targetAmt,
        currentAmount: currentAmt,
        deadlineDate: t.deadline_date,
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
        needsTotalTarget,
        needsTotalAllocated,
        needsShortTermTarget,
        needsShortTermAllocated,
        needsLongTermTarget,
        needsLongTermAllocated,
        wantsTotalTarget,
        wantsTotalAllocated,
        wantsShortTermTarget,
        wantsShortTermAllocated,
        wantsLongTermTarget,
        wantsLongTermAllocated,
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

    const classification = inferTargetClassification(
      target.category,
      (target as any).target_type,
      (target as any).timeframe
    );

    sendSuccess({
      res,
      message: 'Financial target retrieved successfully',
      data: {
        ...target.toJSON(),
        targetType: classification.targetType,
        timeframe: classification.timeframe,
        targetAmount: targetAmt,
        currentAmount: currentAmt,
        deadlineDate: target.deadline_date,
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
    const {
      name,
      category,
      targetAmount,
      currentAmount,
      deadlineDate,
      priority,
      status,
      notes,
      targetType,
      timeframe,
    } = req.body;

    const classification = inferTargetClassification(
      category || 'other_needs_short',
      targetType,
      timeframe
    );

    const target = await FinancialTarget.create({
      id: undefined as any,
      user_id: userId,
      name,
      target_type: classification.targetType,
      timeframe: classification.timeframe,
      category: category || 'other_needs_short',
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
        targetType: classification.targetType,
        timeframe: classification.timeframe,
        targetAmount: targetAmt,
        currentAmount: currentAmt,
        deadlineDate: target.deadline_date,
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

    const {
      name,
      category,
      targetAmount,
      currentAmount,
      deadlineDate,
      priority,
      status,
      notes,
      targetType,
      timeframe,
    } = req.body;

    await target.update({
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(targetType !== undefined && { target_type: targetType }),
      ...(timeframe !== undefined && { timeframe }),
      ...(targetAmount !== undefined && { target_amount: Number(targetAmount) }),
      ...(currentAmount !== undefined && { current_amount: Number(currentAmount) }),
      ...(deadlineDate !== undefined && { deadline_date: deadlineDate }),
      ...(priority !== undefined && { priority }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      updated_by: userId || 'system',
    });

    const classification = inferTargetClassification(
      target.category,
      (target as any).target_type,
      (target as any).timeframe
    );

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
        targetType: classification.targetType,
        timeframe: classification.timeframe,
        targetAmount: targetAmt,
        currentAmount: currentAmt,
        deadlineDate: target.deadline_date,
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
