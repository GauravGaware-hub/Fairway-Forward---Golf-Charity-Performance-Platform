import { Router } from 'express';
import {
  adminApproveProof,
  adminGetWinnerById,
  adminListWinners,
  adminMarkPaid,
  adminRejectProof,
  getUserWinningById,
  getUserWinnings,
  submitWinnerProof,
} from '../controllers/payout.controller.js';
import { requireActiveSubscription, requireAdmin, requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// User Endpoints
router.get('/me/winnings', requireAuth, requireActiveSubscription, getUserWinnings);
router.get('/me/winnings/:id', requireAuth, requireActiveSubscription, getUserWinningById);
router.post('/me/winnings/:id/proof', requireAuth, requireActiveSubscription, submitWinnerProof);

// Admin Endpoints
router.get('/admin/winners', requireAuth, requireAdmin, adminListWinners);
router.get('/admin/winners/:id', requireAuth, requireAdmin, adminGetWinnerById);
router.post('/admin/winners/:id/approve', requireAuth, requireAdmin, adminApproveProof);
router.post('/admin/winners/:id/reject', requireAuth, requireAdmin, adminRejectProof);
router.post('/admin/winners/:id/mark-paid', requireAuth, requireAdmin, adminMarkPaid);

export default router;
