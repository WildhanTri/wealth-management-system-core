import { Router } from 'express';
import {
  listFixedCosts,
  createFixedCost,
  updateFixedCost,
  deleteFixedCost,
  toggleFixedCostPaid,
  getFixedCostHistory,
  reorderFixedCosts,
} from '../controllers/fixedCost.controller.js';
import { validate } from '../middlewares/validator.js';
import {
  createFixedCostSchema,
  updateFixedCostSchema,
  togglePaidFixedCostSchema,
} from '../validations/fixedCost.schema.js';

const router = Router();

router.get('/', listFixedCosts);
router.get('/history', getFixedCostHistory);
router.post('/reorder', reorderFixedCosts);
router.post('/', validate(createFixedCostSchema), createFixedCost);
router.put('/:id', validate(updateFixedCostSchema), updateFixedCost);
router.delete('/:id', deleteFixedCost);
router.post('/:id/toggle-paid', validate(togglePaidFixedCostSchema), toggleFixedCostPaid);

export default router;

