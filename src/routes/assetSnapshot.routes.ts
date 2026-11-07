import { Router } from 'express';
import {
  listAssetSnapshots,
  getAssetSnapshotById,
  createAssetSnapshot,
  updateAssetSnapshot,
  deleteAssetSnapshot,
} from '../controllers/assetSnapshot.controller.js';
import { validate } from '../middlewares/validator.js';
import {
  createAssetSnapshotSchema,
  updateAssetSnapshotSchema,
} from '../validations/assetSnapshot.schema.js';

const router = Router();

router.get('/', listAssetSnapshots);
router.get('/:id', getAssetSnapshotById);
router.post('/', validate(createAssetSnapshotSchema), createAssetSnapshot);
router.put('/:id', validate(updateAssetSnapshotSchema), updateAssetSnapshot);
router.delete('/:id', deleteAssetSnapshot);

export default router;

