import { Router } from 'express';
import {
  listFinancialTargets,
  getFinancialTargetById,
  createFinancialTarget,
  updateFinancialTarget,
  deleteFinancialTarget,
  allocateFundsToTarget,
  reorderFinancialTargets,
} from '../controllers/financialTarget.controller.js';
import { validate } from '../middlewares/validator.js';
import {
  createFinancialTargetSchema,
  updateFinancialTargetSchema,
  allocateTargetFundsSchema,
} from '../validations/financialTarget.schema.js';

const router = Router();

router.get('/', listFinancialTargets);
router.post('/reorder', reorderFinancialTargets);
router.get('/:id', getFinancialTargetById);
router.post('/', validate(createFinancialTargetSchema), createFinancialTarget);
router.put('/:id', validate(updateFinancialTargetSchema), updateFinancialTarget);
router.delete('/:id', deleteFinancialTarget);
router.post('/:id/allocate', validate(allocateTargetFundsSchema), allocateFundsToTarget);

export default router;

