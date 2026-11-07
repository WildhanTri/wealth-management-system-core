import { Router } from 'express';
import {
  listQuarantineItems,
  createQuarantineItem,
  resolveQuarantineItem,
  deleteQuarantineItem,
} from '../controllers/quarantineItem.controller.js';
import { validate } from '../middlewares/validator.js';
import {
  createQuarantineItemSchema,
  resolveQuarantineSchema,
} from '../validations/quarantineItem.schema.js';

const router = Router();

router.get('/', listQuarantineItems);
router.post('/', validate(createQuarantineItemSchema), createQuarantineItem);
router.post('/:id/resolve', validate(resolveQuarantineSchema), resolveQuarantineItem);
router.delete('/:id', deleteQuarantineItem);

export default router;

