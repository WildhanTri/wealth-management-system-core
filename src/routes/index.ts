import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userProfileRoutes from './userProfile.routes.js';
import assetRoutes from './asset.routes.js';
import transactionRoutes from './transaction.routes.js';
import plannedExpenseRoutes from './plannedExpense.routes.js';
import quarantineItemRoutes from './quarantineItem.routes.js';
import assetSnapshotRoutes from './assetSnapshot.routes.js';
import analyticsRoutes from './analytics.routes.js';
import apiLogRoutes from './apiLog.routes.js';
import revenueStreamRoutes from './revenueStream.routes.js';
import fixedCostRoutes from './fixedCost.routes.js';
import financialTargetRoutes from './financialTarget.routes.js';
import debtRoutes from './debt.routes.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    statusCode: 200,
    message: 'Crescent Wealth Management Core API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes (register, login, forgot-password, reset-password, change-password, me)
router.use('/auth', authRoutes);

// Protected financial and domain routes
router.use('/profile', authenticate, userProfileRoutes);
router.use('/assets', authenticate, assetRoutes);
router.use('/transactions', authenticate, transactionRoutes);
router.use('/plans', authenticate, plannedExpenseRoutes);
router.use('/quarantine', authenticate, quarantineItemRoutes);
router.use('/snapshots', authenticate, assetSnapshotRoutes);
router.use('/analytics', authenticate, analyticsRoutes);

// Financial Planning Hub (Revenue Streams, Fixed Costs, Financial Targets, Debts)
router.use('/revenue-streams', authenticate, revenueStreamRoutes);
router.use('/fixed-costs', authenticate, fixedCostRoutes);
router.use('/financial-targets', authenticate, financialTargetRoutes);
router.use('/debts', authenticate, debtRoutes);

// API Logs & DB inspector
router.use('/api-logs', apiLogRoutes);

export default router;
