import { Router } from 'express';
import {
  listAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  reorderAssets,
} from '../controllers/asset.controller.js';
import { validate } from '../middlewares/validator.js';
import {
  createAssetSchema,
  updateAssetSchema,
  reorderAssetsSchema,
} from '../validations/asset.schema.js';

const router = Router();

router.get('/', listAssets);
router.put('/reorder', validate(reorderAssetsSchema), reorderAssets);
router.get('/:id', getAssetById);
router.post('/', validate(createAssetSchema), createAsset);
router.put('/:id', validate(updateAssetSchema), updateAsset);
router.delete('/:id', deleteAsset);

export default router;

