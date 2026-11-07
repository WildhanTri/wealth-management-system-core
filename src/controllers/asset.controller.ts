import { Request, Response } from 'express';
import { Asset } from '../models/Asset.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';

export async function listAssets(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { assetClass, liquidityTier } = req.query;
    const where: any = { is_deleted: false };

    if (userId) where.user_id = userId;
    if (assetClass) where.asset_class = assetClass;
    if (liquidityTier) where.liquidity_tier = liquidityTier;

    const assets = await Asset.findAll({
      where,
      order: [
        ['display_order', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });

    const totalValue = assets.reduce((sum, a) => sum + Number(a.estimated_value), 0);

    sendSuccess({
      res,
      message: 'Assets retrieved successfully',
      data: assets,
      meta: {
        count: assets.length,
        totalEstimatedValue: totalValue,
      },
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function getAssetById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const asset = await Asset.findOne({ where });

    if (!asset) {
      sendError({ res, statusCode: 404, message: 'Asset not found' });
      return;
    }

    sendSuccess({
      res,
      message: 'Asset retrieved successfully',
      data: asset,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function createAsset(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const {
      name,
      description,
      assetClass,
      type,
      estimatedValue,
      liquidityTier,
      riskLevel,
      appreciationType,
      displayOrder,
    } = req.body;

    const asset = await Asset.create({
      id: undefined as any,
      user_id: userId || null,
      name,
      description,
      asset_class: assetClass,
      type,
      estimated_value: estimatedValue,
      liquidity_tier: liquidityTier || 'instant_liquid',
      risk_level: riskLevel || 'low',
      appreciation_type: appreciationType || null,
      display_order: displayOrder !== undefined ? displayOrder : 0,
      created_by: userId || 'user',
      updated_by: userId || 'user',
      is_active: true,
      is_deleted: false,
    });

    sendCreated({
      res,
      message: 'Asset created successfully',
      data: asset,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function updateAsset(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const {
      name,
      description,
      assetClass,
      type,
      estimatedValue,
      liquidityTier,
      riskLevel,
      appreciationType,
      displayOrder,
      isActive,
    } = req.body;

    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const asset = await Asset.findOne({ where });

    if (!asset) {
      sendError({ res, statusCode: 404, message: 'Asset not found' });
      return;
    }

    await asset.update({
      name: name !== undefined ? name : asset.name,
      description: description !== undefined ? description : asset.description,
      asset_class: assetClass !== undefined ? assetClass : asset.asset_class,
      type: type !== undefined ? type : asset.type,
      estimated_value: estimatedValue !== undefined ? estimatedValue : asset.estimated_value,
      liquidity_tier: liquidityTier !== undefined ? liquidityTier : asset.liquidity_tier,
      risk_level: riskLevel !== undefined ? riskLevel : asset.risk_level,
      appreciation_type: appreciationType !== undefined ? appreciationType : asset.appreciation_type,
      display_order: displayOrder !== undefined ? displayOrder : asset.display_order,
      is_active: isActive !== undefined ? isActive : asset.is_active,
      updated_by: userId || 'user',
    });

    sendSuccess({
      res,
      message: 'Asset updated successfully',
      data: asset,
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function reorderAssets(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { assetIds } = req.body;

    if (Array.isArray(assetIds) && assetIds.length > 0) {
      await Promise.all(
        assetIds.map((id: string, index: number) =>
          Asset.update(
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
      message: 'Asset order updated successfully',
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

export async function deleteAsset(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const where: any = { id, is_deleted: false };
    if (userId) where.user_id = userId;

    const asset = await Asset.findOne({ where });

    if (!asset) {
      sendError({ res, statusCode: 404, message: 'Asset not found' });
      return;
    }

    // Soft delete according to architecture standard
    await asset.update({
      is_deleted: true,
      is_active: false,
      updated_by: userId || 'user',
    });

    sendSuccess({
      res,
      message: 'Asset deleted successfully',
    });
  } catch (error: any) {
    sendError({ res, message: error.message });
  }
}

