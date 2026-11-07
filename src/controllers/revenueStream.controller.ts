import { Request, Response } from 'express';
import { RevenueStream } from '../models/RevenueStream.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';

export async function listRevenueStreams(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { category, status } = req.query;
    const where: any = { is_deleted: false };

    if (userId) where.user_id = userId;
    if (category) where.category = category;
    if (status) where.status = status;

    const streams = await RevenueStream.findAll({
      where,
      order: [
        ['display_order', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });

    // Aggregate monthly statistics
    let totalMonthly = 0;
    let mainJobTotal = 0;
    let sideHustleTotal = 0;
    let passiveTotal = 0;

    streams.forEach((s) => {
      if (s.status === 'active') {
        const amt = Number(s.amount) || 0;
        totalMonthly += amt;
        if (s.category === 'main_job') mainJobTotal += amt;
        else if (s.category === 'side_hustle') sideHustleTotal += amt;
        else if (s.category === 'passive_income') passiveTotal += amt;
      }
    });

    sendSuccess({
      res,
      message: 'Revenue streams retrieved successfully',
      data: streams,
      meta: {
        totalStreams: streams.length,
        totalMonthly,
        mainJobTotal,
        sideHustleTotal,
        passiveTotal,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function getRevenueStreamById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const stream = await RevenueStream.findOne({ where });
    if (!stream) {
      sendError({ res, statusCode: 404, message: 'Revenue stream not found' });
      return;
    }

    sendSuccess({
      res,
      message: 'Revenue stream retrieved successfully',
      data: stream,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function createRevenueStream(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { name, category, amount, frequency, status, notes } = req.body;

    const stream = await RevenueStream.create({
      id: undefined as any,
      user_id: userId,
      name,
      category: category || 'main_job',
      amount: Number(amount) || 0,
      frequency: frequency || 'monthly',
      status: status || 'active',
      notes,
      created_by: userId || 'system',
      updated_by: userId || 'system',
      is_active: true,
      is_deleted: false,
    });

    sendCreated({
      res,
      message: 'Revenue stream created successfully',
      data: {
        ...stream.toJSON(),
        amount: Number(stream.amount) || 0,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function updateRevenueStream(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const stream = await RevenueStream.findOne({ where });
    if (!stream) {
      sendError({ res, statusCode: 404, message: 'Revenue stream not found' });
      return;
    }

    const { name, category, amount, frequency, status, notes } = req.body;
    await stream.update({
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(frequency !== undefined && { frequency }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      updated_by: userId || 'system',
    });

    sendSuccess({
      res,
      message: 'Revenue stream updated successfully',
      data: {
        ...stream.toJSON(),
        amount: Number(stream.amount) || 0,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function deleteRevenueStream(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const stream = await RevenueStream.findOne({ where });
    if (!stream) {
      sendError({ res, statusCode: 404, message: 'Revenue stream not found' });
      return;
    }

    await stream.update({
      is_deleted: true,
      updated_by: userId || 'system',
    });

    sendSuccess({
      res,
      message: 'Revenue stream deleted successfully',
      data: { id },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function toggleRevenueStreamStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const stream = await RevenueStream.findOne({ where });
    if (!stream) {
      sendError({ res, statusCode: 404, message: 'Revenue stream not found' });
      return;
    }

    const newStatus = stream.status === 'active' ? 'inactive' : 'active';
    await stream.update({
      status: newStatus,
      updated_by: userId || 'system',
    });

    sendSuccess({
      res,
      message: `Revenue stream status changed to ${newStatus}`,
      data: stream,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function reorderRevenueStreams(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { streamIds } = req.body;

    if (Array.isArray(streamIds) && streamIds.length > 0) {
      await Promise.all(
        streamIds.map((id: string, index: number) =>
          RevenueStream.update(
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
      message: 'Revenue streams reordered successfully',
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}
