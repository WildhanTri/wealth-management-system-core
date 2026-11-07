import { Router } from 'express';
import {
  listRevenueStreams,
  getRevenueStreamById,
  createRevenueStream,
  updateRevenueStream,
  deleteRevenueStream,
  toggleRevenueStreamStatus,
  reorderRevenueStreams,
} from '../controllers/revenueStream.controller.js';
import { validate } from '../middlewares/validator.js';
import {
  createRevenueStreamSchema,
  updateRevenueStreamSchema,
} from '../validations/revenueStream.schema.js';

const router = Router();

router.get('/', listRevenueStreams);
router.post('/reorder', reorderRevenueStreams);
router.get('/:id', getRevenueStreamById);
router.post('/', validate(createRevenueStreamSchema), createRevenueStream);
router.put('/:id', validate(updateRevenueStreamSchema), updateRevenueStream);
router.delete('/:id', deleteRevenueStream);
router.patch('/:id/toggle-status', toggleRevenueStreamStatus);

export default router;

