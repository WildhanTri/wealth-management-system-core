import { Router } from 'express';
import { getFinancialOverview } from '../controllers/analytics.controller.js';

const router = Router();

router.get('/overview', getFinancialOverview);

export default router;

