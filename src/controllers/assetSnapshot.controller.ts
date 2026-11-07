import { Request, Response } from 'express';
import { AssetSnapshot, Asset } from '../models/index.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';

export async function listAssetSnapshots(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const where: any = { is_deleted: false };
    if (userId) where.user_id = userId;

    const snapshots = await AssetSnapshot.findAll({
      where,
      order: [['snapshot_date', 'ASC']],
    });

    sendSuccess({
      res,
      message: 'Asset snapshots retrieved successfully',
      data: snapshots,
      meta: {
        count: snapshots.length,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function getAssetSnapshotById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const snapshot = await AssetSnapshot.findOne({ where });

    if (!snapshot) {
      sendError({ res, statusCode: 404, message: 'Asset snapshot not found' });
      return;
    }

    sendSuccess({
      res,
      message: 'Asset snapshot retrieved successfully',
      data: snapshot,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function createAssetSnapshot(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const {
      name,
      description,
      snapshotDate,
      totalNetWorth,
      totalCash,
      totalHard,
      totalInvestment,
      notes,
      itemsSnapshot,
      syncWithLiveAssets,
    } = req.body;

    // Calculate totals if not directly supplied
    let calcCash = totalCash || 0;
    let calcHard = totalHard || 0;
    let calcInv = totalInvestment || 0;

    if (Array.isArray(itemsSnapshot) && itemsSnapshot.length > 0 && totalNetWorth === undefined) {
      calcCash = 0;
      calcHard = 0;
      calcInv = 0;
      for (const item of itemsSnapshot) {
        const v = Number(item.estimatedValue || item.estimated_value) || 0;
        const cls = item.assetClass || item.asset_class;
        if (cls === 'cash_equivalent') calcCash += v;
        else if (cls === 'hard_asset_movable' || cls === 'hard_asset_immovable') calcHard += v;
        else if (cls === 'investment') calcInv += v;
      }
    }

    const calcNetWorth = totalNetWorth !== undefined ? totalNetWorth : calcCash + calcHard + calcInv;

    const snapshot = await AssetSnapshot.create({
      id: undefined as any,
      user_id: userId || null,
      name: name || `Valuation ${snapshotDate}`,
      description,
      snapshot_date: snapshotDate,
      total_net_worth: calcNetWorth,
      total_cash: calcCash,
      total_hard: calcHard,
      total_investment: calcInv,
      notes,
      items_snapshot: itemsSnapshot || [],
      created_by: userId || 'user',
      updated_by: userId || 'user',
      is_active: true,
      is_deleted: false,
    });

    // Optionally synchronize with live active assets
    if (syncWithLiveAssets && Array.isArray(itemsSnapshot) && itemsSnapshot.length > 0) {
      for (const item of itemsSnapshot) {
        if (item.id) {
          const assetWhere: any = { id: item.id };
          if (userId) assetWhere.user_id = userId;
          const existing = await Asset.findOne({ where: assetWhere });
          if (existing) {
            await existing.update({
              estimated_value: item.estimatedValue || item.estimated_value,
              updated_by: userId || 'snapshot_sync',
            });
          }
        }
      }
    }

    sendCreated({
      res,
      message: 'Asset snapshot recorded successfully',
      data: snapshot,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function updateAssetSnapshot(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { name, description, snapshotDate, notes, itemsSnapshot, totalNetWorth, totalCash, totalHard, totalInvestment } = req.body;

    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const snapshot = await AssetSnapshot.findOne({ where });

    if (!snapshot) {
      sendError({ res, statusCode: 404, message: 'Asset snapshot not found' });
      return;
    }

    await snapshot.update({
      name: name !== undefined ? name : snapshot.name,
      description: description !== undefined ? description : snapshot.description,
      snapshot_date: snapshotDate !== undefined ? snapshotDate : snapshot.snapshot_date,
      notes: notes !== undefined ? notes : snapshot.notes,
      items_snapshot: itemsSnapshot !== undefined ? itemsSnapshot : snapshot.items_snapshot,
      total_net_worth: totalNetWorth !== undefined ? totalNetWorth : snapshot.total_net_worth,
      total_cash: totalCash !== undefined ? totalCash : snapshot.total_cash,
      total_hard: totalHard !== undefined ? totalHard : snapshot.total_hard,
      total_investment: totalInvestment !== undefined ? totalInvestment : snapshot.total_investment,
      updated_by: userId || 'user',
    });

    sendSuccess({
      res,
      message: 'Asset snapshot updated successfully',
      data: snapshot,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function deleteAssetSnapshot(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const snapshot = await AssetSnapshot.findOne({ where });

    if (!snapshot) {
      sendError({ res, statusCode: 404, message: 'Asset snapshot not found' });
      return;
    }

    await snapshot.update({
      is_deleted: true,
      is_active: false,
      updated_by: userId || 'user',
    });

    sendSuccess({
      res,
      message: 'Asset snapshot deleted successfully',
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}
