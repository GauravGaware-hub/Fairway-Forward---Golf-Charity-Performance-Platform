import { Router } from 'express';
import {
  adminCreateDraw,
  adminGetDrawById,
  adminListDraws,
  adminPublishDraw,
  adminSimulateDraw,
  getMyWinnings,
  getDrawById,
  getPublicDraws,
  getUserEntryForDraw,
} from '../controllers/draw.controller.js';
import { requireActiveSubscription, requireAdmin, requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Admin Endpoints
router.post('/admin/draws', requireAuth, requireAdmin, adminCreateDraw);
router.get('/admin/draws', requireAuth, requireAdmin, adminListDraws);
router.get('/admin/draws/:id', requireAuth, requireAdmin, adminGetDrawById);
router.post('/admin/draws/:id/simulate', requireAuth, requireAdmin, adminSimulateDraw);
router.post('/admin/draws/:id/publish', requireAuth, requireAdmin, adminPublishDraw);

// User / Public Endpoints
router.get('/draws', getPublicDraws);
router.get('/draws/:id', getDrawById);
router.get('/draws/:id/entry', requireAuth, requireActiveSubscription, getUserEntryForDraw);
router.get('/me/winnings', requireAuth, requireActiveSubscription, getMyWinnings);

export default router;
