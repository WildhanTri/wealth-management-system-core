import { Router } from 'express';
import {
  listDebts,
  getDebtById,
  createDebt,
  updateDebt,
  deleteDebt,
  recordDebtPayment,
  reorderDebts,
} from '../controllers/debt.controller.js';
import { validate } from '../middlewares/validator.js';
import {
  createDebtSchema,
  updateDebtSchema,
  recordDebtPaymentSchema,
} from '../validations/debt.schema.js';

const router = Router();

router.get('/', listDebts);
router.post('/reorder', reorderDebts);
router.get('/:id', getDebtById);
router.post('/', validate(createDebtSchema), createDebt);
router.put('/:id', validate(updateDebtSchema), updateDebt);
router.delete('/:id', deleteDebt);
router.post('/:id/payment', validate(recordDebtPaymentSchema), recordDebtPayment);

export default router;
