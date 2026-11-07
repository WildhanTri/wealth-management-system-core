import { Request, Response } from 'express';
import { ApiLog } from '../models/ApiLog.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function listApiLogs(req: Request, res: Response): Promise<void> {
  try {
    const { method, statusCode, limit = '50', offset = '0', search } = req.query;
    const where: any = { is_deleted: false };

    if (method) where.method = (method as string).toUpperCase();
    if (statusCode) where.status_code = parseInt(statusCode as string, 10);

    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const offsetNum = Math.max(0, parseInt(offset as string, 10) || 0);

    const { count, rows } = await ApiLog.findAndCountAll({
      where,
      limit: limitNum,
      offset: offsetNum,
      order: [['created_at', 'DESC']],
    });

    sendSuccess({
      res,
      message: 'API logs retrieved successfully',
      data: rows,
      meta: {
        total: count,
        limit: limitNum,
        offset: offsetNum,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function getApiLogById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const log = await ApiLog.findOne({
      where: { id, is_deleted: false },
    });

    if (!log) {
      sendError({ res, statusCode: 404, message: 'API log entry not found' });
      return;
    }

    sendSuccess({
      res,
      message: 'API log retrieved successfully',
      data: log,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

