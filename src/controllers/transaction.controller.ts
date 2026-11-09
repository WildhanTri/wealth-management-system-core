import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Transaction } from '../models/Transaction.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';

export async function listTransactions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { category, isImpulse, startDate, endDate, type } = req.query;
    const where: any = { is_deleted: false };

    if (userId) where.user_id = userId;
    if (category) where.category = category;
    if (type) where.type = type;
    if (isImpulse !== undefined) where.is_impulse = isImpulse === 'true';

    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.date = { [Op.lte]: endDate };
    }

    const transactions = await Transaction.findAll({
      where,
      order: [['date', 'DESC'], ['display_order', 'ASC'], ['created_at', 'DESC']],
    });

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = transactions
      .filter((t) => t.type !== 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const netCashFlow = totalIncome - totalExpense;
    const impulseAmount = transactions
      .filter((t) => t.type !== 'income' && t.is_impulse)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    sendSuccess({
      res,
      message: 'Transactions retrieved successfully',
      data: transactions,
      meta: {
        count: transactions.length,
        totalIncome,
        totalExpense,
        netCashFlow,
        totalAmount: totalExpense,
        impulseAmount,
        impulseRatio: totalExpense > 0 ? Math.round((impulseAmount / totalExpense) * 100) : 0,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function getTransactionById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const transaction = await Transaction.findOne({ where });

    if (!transaction) {
      sendError({ res, statusCode: 404, message: 'Transaction not found' });
      return;
    }

    sendSuccess({
      res,
      message: 'Transaction retrieved successfully',
      data: transaction,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function createTransaction(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { name, description, amount, category, date, emotionalTrigger, isImpulse, type } = req.body;
    const isIncome = type === 'income';

    const transaction = await Transaction.create({
      id: undefined as any,
      user_id: userId || null,
      name,
      description,
      type: isIncome ? 'income' : 'expense',
      amount,
      category,
      date,
      emotional_trigger: isIncome ? 'Need' : (emotionalTrigger || 'Need'),
      is_impulse: isIncome ? false : (isImpulse || false),
      created_by: userId || 'user',
      updated_by: userId || 'user',
      is_active: true,
      is_deleted: false,
    });

    sendCreated({
      res,
      message: 'Transaction recorded successfully',
      data: transaction,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function updateTransaction(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { name, description, amount, category, date, emotionalTrigger, isImpulse, isActive, type } = req.body;

    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const transaction = await Transaction.findOne({ where });

    if (!transaction) {
      sendError({ res, statusCode: 404, message: 'Transaction not found' });
      return;
    }

    await transaction.update({
      name: name !== undefined ? name : transaction.name,
      description: description !== undefined ? description : transaction.description,
      type: type !== undefined ? type : transaction.type,
      amount: amount !== undefined ? amount : transaction.amount,
      category: category !== undefined ? category : transaction.category,
      date: date !== undefined ? date : transaction.date,
      emotional_trigger: emotionalTrigger !== undefined ? emotionalTrigger : transaction.emotional_trigger,
      is_impulse: isImpulse !== undefined ? isImpulse : transaction.is_impulse,
      is_active: isActive !== undefined ? isActive : transaction.is_active,
      updated_by: userId || 'user',
    });

    sendSuccess({
      res,
      message: 'Transaction updated successfully',
      data: transaction,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function deleteTransaction(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const transaction = await Transaction.findOne({ where });

    if (!transaction) {
      sendError({ res, statusCode: 404, message: 'Transaction not found' });
      return;
    }

    await transaction.update({
      is_deleted: true,
      is_active: false,
      updated_by: userId || 'user',
    });

    sendSuccess({
      res,
      message: 'Transaction deleted successfully',
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function reorderTransactions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { transactionIds } = req.body;

    if (Array.isArray(transactionIds) && transactionIds.length > 0) {
      await Promise.all(
        transactionIds.map((id: string, index: number) =>
          Transaction.update(
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
      message: 'Transactions reordered successfully',
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}
