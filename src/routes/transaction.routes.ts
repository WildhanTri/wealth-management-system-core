import { Router } from 'express';
import {
  listTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transaction.controller.js';
import { validate } from '../middlewares/validator.js';
import { createTransactionSchema, updateTransactionSchema } from '../validations/transaction.schema.js';

const router = Router();

router.get('/', listTransactions);
router.get('/:id', getTransactionById);
router.post('/', validate(createTransactionSchema), createTransaction);
router.put('/:id', validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;

