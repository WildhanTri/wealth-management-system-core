import { Router } from 'express';
import { listApiLogs, getApiLogById } from '../controllers/apiLog.controller.js';

const router = Router();

router.get('/', listApiLogs);
router.get('/:id', getApiLogById);

export default router;

