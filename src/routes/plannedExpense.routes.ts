import { Router } from 'express';
import {
  listPlannedExpenses,
  getPlannedExpenseById,
  createPlannedExpense,
  updatePlannedExpense,
  allocateFunds,
  deletePlannedExpense,
} from '../controllers/plannedExpense.controller.js';
import { validate } from '../middlewares/validator.js';
import {
  createPlannedExpenseSchema,
  updatePlannedExpenseSchema,
  allocateFundsSchema,
} from '../validations/plannedExpense.schema.js';

const router = Router();

router.get('/', listPlannedExpenses);
router.get('/:id', getPlannedExpenseById);
router.post('/', validate(createPlannedExpenseSchema), createPlannedExpense);
router.put('/:id', validate(updatePlannedExpenseSchema), updatePlannedExpense);
router.post('/:id/allocate', validate(allocateFundsSchema), allocateFunds);
router.delete('/:id', deletePlannedExpense);

export default router;

