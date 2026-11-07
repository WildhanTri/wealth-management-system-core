import { Request, Response } from 'express';
import { PlannedExpense } from '../models/PlannedExpense.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';

export async function listPlannedExpenses(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { status, priority, category } = req.query;
    const where: any = { is_deleted: false };

    if (userId) where.user_id = userId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    const plans = await PlannedExpense.findAll({
      where,
      order: [['target_date', 'ASC']],
    });

    const totalTarget = plans.reduce((sum, p) => sum + Number(p.target_amount), 0);
    const totalAccumulated = plans.reduce((sum, p) => sum + Number(p.current_amount), 0);

    sendSuccess({
      res,
      message: 'Planned expenses retrieved successfully',
      data: plans,
      meta: {
        count: plans.length,
        totalTarget,
        totalAccumulated,
        overallProgress: totalTarget > 0 ? Math.round((totalAccumulated / totalTarget) * 100) : 0,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function getPlannedExpenseById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const plan = await PlannedExpense.findOne({ where });

    if (!plan) {
      sendError({ res, statusCode: 404, message: 'Planned expense not found' });
      return;
    }

    sendSuccess({
      res,
      message: 'Planned expense retrieved successfully',
      data: plan,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function createPlannedExpense(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { name, description, targetAmount, currentAmount, category, targetDate, priority, status, notes } = req.body;

    const plan = await PlannedExpense.create({
      id: undefined as any,
      user_id: userId || null,
      name,
      description,
      target_amount: targetAmount,
      current_amount: currentAmount || 0,
      category,
      target_date: targetDate,
      priority: priority || 'medium',
      status: status || 'active',
      notes,
      created_by: userId || 'user',
      updated_by: userId || 'user',
      is_active: true,
      is_deleted: false,
    });

    sendCreated({
      res,
      message: 'Planned expense created successfully',
      data: plan,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function updatePlannedExpense(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { name, description, targetAmount, currentAmount, category, targetDate, priority, status, notes, isActive } = req.body;

    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const plan = await PlannedExpense.findOne({ where });

    if (!plan) {
      sendError({ res, statusCode: 404, message: 'Planned expense not found' });
      return;
    }

    await plan.update({
      name: name !== undefined ? name : plan.name,
      description: description !== undefined ? description : plan.description,
      target_amount: targetAmount !== undefined ? targetAmount : plan.target_amount,
      current_amount: currentAmount !== undefined ? currentAmount : plan.current_amount,
      category: category !== undefined ? category : plan.category,
      target_date: targetDate !== undefined ? targetDate : plan.target_date,
      priority: priority !== undefined ? priority : plan.priority,
      status: status !== undefined ? status : plan.status,
      notes: notes !== undefined ? notes : plan.notes,
      is_active: isActive !== undefined ? isActive : plan.is_active,
      updated_by: userId || 'user',
    });

    sendSuccess({
      res,
      message: 'Planned expense updated successfully',
      data: plan,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function allocateFunds(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { additionalAmount } = req.body;

    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const plan = await PlannedExpense.findOne({ where });

    if (!plan) {
      sendError({ res, statusCode: 404, message: 'Planned expense not found' });
      return;
    }

    const newAmount = Number(plan.current_amount) + Number(additionalAmount);
    const isCompleted = newAmount >= Number(plan.target_amount);

    await plan.update({
      current_amount: newAmount,
      status: isCompleted ? 'completed' : plan.status,
      updated_by: userId || 'user_allocate',
    });

    sendSuccess({
      res,
      message: `Allocated funds successfully. Current progress: ${newAmount}/${plan.target_amount}`,
      data: plan,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function deletePlannedExpense(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const plan = await PlannedExpense.findOne({ where });

    if (!plan) {
      sendError({ res, statusCode: 404, message: 'Planned expense not found' });
      return;
    }

    await plan.update({
      is_deleted: true,
      is_active: false,
      updated_by: userId || 'user',
    });

    sendSuccess({
      res,
      message: 'Planned expense deleted successfully',
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}
