import { Request, Response } from 'express';
import { Debt } from '../models/Debt.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';

function calculateMonthsRemaining(deadlineStr: string): number {
  const now = new Date();
  const deadline = new Date(deadlineStr);

  let months = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
  if (deadline.getDate() > now.getDate()) {
    months += 1;
  }
  return Math.max(0, months);
}

export async function listDebts(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { category, status } = req.query;

    const where: any = { is_deleted: false };
    if (userId) where.user_id = userId;
    if (category) where.category = category;
    if (status) where.status = status;

    const debts = await Debt.findAll({
      where,
      order: [
        ['display_order', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });

    let totalPrincipal = 0;
    let totalRemaining = 0;
    let totalMonthlyPayment = 0;
    let totalPaidOff = 0;

    const items = debts.map((d) => {
      const totalAmt = Number(d.total_amount) || 0;
      const remainingAmt = Number(d.remaining_amount) || 0;
      const paidAmt = Math.max(0, totalAmt - remainingAmt);
      const remainingMonths = calculateMonthsRemaining(d.deadline_date);
      const monthlyPmt = Number(d.monthly_payment) || 0;
      const payoffPercent = totalAmt > 0 ? Math.min(100, Math.round((paidAmt / totalAmt) * 100)) : 0;

      totalPrincipal += totalAmt;
      totalRemaining += remainingAmt;
      totalPaidOff += paidAmt;
      if (d.status === 'active') {
        totalMonthlyPayment += monthlyPmt;
      }

      return {
        ...d.toJSON(),
        totalAmount: totalAmt,
        remainingAmount: remainingAmt,
        paidAmount: paidAmt,
        payoffPercent,
        remainingMonths,
      };
    });

    const overallPayoffRate =
      totalPrincipal > 0 ? Math.round((totalPaidOff / totalPrincipal) * 100) : 0;

    sendSuccess({
      res,
      message: 'Debts retrieved successfully',
      data: items,
      meta: {
        totalDebts: items.length,
        totalPrincipal,
        totalRemaining,
        totalPaidOff,
        totalMonthlyPayment,
        overallPayoffRate,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function getDebtById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const debt = await Debt.findOne({ where });
    if (!debt) {
      sendError({ res, statusCode: 404, message: 'Debt liability not found' });
      return;
    }

    const totalAmt = Number(debt.total_amount) || 0;
    const remainingAmt = Number(debt.remaining_amount) || 0;
    const paidAmt = Math.max(0, totalAmt - remainingAmt);
    const remainingMonths = calculateMonthsRemaining(debt.deadline_date);
    const payoffPercent = totalAmt > 0 ? Math.min(100, Math.round((paidAmt / totalAmt) * 100)) : 0;

    sendSuccess({
      res,
      message: 'Debt retrieved successfully',
      data: {
        ...debt.toJSON(),
        totalAmount: totalAmt,
        remainingAmount: remainingAmt,
        paidAmount: paidAmt,
        payoffPercent,
        remainingMonths,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function createDebt(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const {
      name,
      category,
      lender,
      totalAmount,
      remainingAmount,
      monthlyPayment,
      interestRate,
      deadlineDate,
      status,
      notes,
    } = req.body;

    const parsedTotal = Number(totalAmount) || 0;
    const parsedRemaining = remainingAmount !== undefined ? Number(remainingAmount) : parsedTotal;

    const debt = await Debt.create({
      id: undefined as any,
      user_id: userId,
      name,
      category: category || 'other',
      lender: lender || null,
      total_amount: parsedTotal,
      remaining_amount: parsedRemaining,
      monthly_payment: monthlyPayment !== undefined && monthlyPayment !== null ? Number(monthlyPayment) : null,
      interest_rate: interestRate !== undefined && interestRate !== null ? Number(interestRate) : null,
      deadline_date: deadlineDate,
      status: parsedRemaining <= 0 ? 'paid_off' : (status || 'active'),
      notes: notes || null,
      created_by: userId || 'system',
      updated_by: userId || 'system',
      is_active: true,
      is_deleted: false,
    });

    const totalAmt = Number(debt.total_amount) || 0;
    const remainingAmt = Number(debt.remaining_amount) || 0;
    const paidAmt = Math.max(0, totalAmt - remainingAmt);
    const remainingMonths = calculateMonthsRemaining(debt.deadline_date);
    const payoffPercent = totalAmt > 0 ? Math.min(100, Math.round((paidAmt / totalAmt) * 100)) : 0;

    sendCreated({
      res,
      message: 'Debt liability registered successfully',
      data: {
        ...debt.toJSON(),
        totalAmount: totalAmt,
        remainingAmount: remainingAmt,
        paidAmount: paidAmt,
        monthlyPayment: debt.monthly_payment !== null ? Number(debt.monthly_payment) : null,
        interestRate: debt.interest_rate !== null ? Number(debt.interest_rate) : null,
        payoffPercent,
        remainingMonths,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function updateDebt(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const debt = await Debt.findOne({ where });
    if (!debt) {
      sendError({ res, statusCode: 404, message: 'Debt liability not found' });
      return;
    }

    const {
      name,
      category,
      lender,
      totalAmount,
      remainingAmount,
      monthlyPayment,
      interestRate,
      deadlineDate,
      status,
      notes,
    } = req.body;

    const newRemaining = remainingAmount !== undefined ? Number(remainingAmount) : Number(debt.remaining_amount);
    let resolvedStatus = status !== undefined ? status : debt.status;
    if (newRemaining <= 0) {
      resolvedStatus = 'paid_off';
    }

    await debt.update({
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(lender !== undefined && { lender }),
      ...(totalAmount !== undefined && { total_amount: Number(totalAmount) }),
      ...(remainingAmount !== undefined && { remaining_amount: newRemaining }),
      ...(monthlyPayment !== undefined && { monthly_payment: monthlyPayment !== null ? Number(monthlyPayment) : null }),
      ...(interestRate !== undefined && { interest_rate: interestRate !== null ? Number(interestRate) : null }),
      ...(deadlineDate !== undefined && { deadline_date: deadlineDate }),
      status: resolvedStatus,
      ...(notes !== undefined && { notes }),
      updated_by: userId || 'system',
    });

    const totalAmt = Number(debt.total_amount) || 0;
    const remainingAmt = Number(debt.remaining_amount) || 0;
    const paidAmt = Math.max(0, totalAmt - remainingAmt);
    const remainingMonths = calculateMonthsRemaining(debt.deadline_date);
    const payoffPercent = totalAmt > 0 ? Math.min(100, Math.round((paidAmt / totalAmt) * 100)) : 0;

    sendSuccess({
      res,
      message: 'Debt liability updated successfully',
      data: {
        ...debt.toJSON(),
        totalAmount: totalAmt,
        remainingAmount: remainingAmt,
        paidAmount: paidAmt,
        monthlyPayment: debt.monthly_payment !== null ? Number(debt.monthly_payment) : null,
        interestRate: debt.interest_rate !== null ? Number(debt.interest_rate) : null,
        payoffPercent,
        remainingMonths,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function deleteDebt(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const debt = await Debt.findOne({ where });
    if (!debt) {
      sendError({ res, statusCode: 404, message: 'Debt liability not found' });
      return;
    }

    await debt.update({
      is_deleted: true,
      updated_by: userId || 'system',
    });

    sendSuccess({
      res,
      message: 'Debt liability deleted successfully',
      data: { id },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function recordDebtPayment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { paymentAmount } = req.body;

    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const debt = await Debt.findOne({ where });
    if (!debt) {
      sendError({ res, statusCode: 404, message: 'Debt liability not found' });
      return;
    }

    const pay = Number(paymentAmount) || 0;
    const currentRemaining = Number(debt.remaining_amount) || 0;
    const nextRemaining = Math.max(0, currentRemaining - pay);
    const nextStatus = nextRemaining === 0 ? 'paid_off' : debt.status;

    await debt.update({
      remaining_amount: nextRemaining,
      status: nextStatus,
      updated_by: userId || 'system',
    });

    const totalAmt = Number(debt.total_amount) || 0;
    const remainingAmt = Number(debt.remaining_amount) || 0;
    const paidAmt = Math.max(0, totalAmt - remainingAmt);
    const remainingMonths = calculateMonthsRemaining(debt.deadline_date);
    const payoffPercent = totalAmt > 0 ? Math.min(100, Math.round((paidAmt / totalAmt) * 100)) : 0;

    sendSuccess({
      res,
      message: nextRemaining === 0 ? 'Debt completely settled & paid off!' : `Payment of ${pay} applied successfully`,
      data: {
        ...debt.toJSON(),
        totalAmount: totalAmt,
        remainingAmount: remainingAmt,
        paidAmount: paidAmt,
        monthlyPayment: debt.monthly_payment !== null ? Number(debt.monthly_payment) : null,
        interestRate: debt.interest_rate !== null ? Number(debt.interest_rate) : null,
        payoffPercent,
        remainingMonths,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function reorderDebts(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { debtIds } = req.body;

    if (Array.isArray(debtIds) && debtIds.length > 0) {
      await Promise.all(
        debtIds.map((id: string, index: number) =>
          Debt.update(
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
      message: 'Debts reordered successfully',
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

