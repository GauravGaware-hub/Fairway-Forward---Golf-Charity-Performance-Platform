import { Router } from "express";
import {
  createScore,
  deleteScore,
  getScores,
  updateScore,
} from "../controllers/score.controller.js";
import { requireActiveSubscription, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// All score management endpoints require authentication AND active subscription
router.get("/scores", requireAuth, requireActiveSubscription, getScores);
router.post("/scores", requireAuth, requireActiveSubscription, createScore);
router.patch("/scores/:id", requireAuth, requireActiveSubscription, updateScore);
router.delete("/scores/:id", requireAuth, requireActiveSubscription, deleteScore);

export default router;
