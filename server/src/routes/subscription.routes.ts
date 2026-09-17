import { Router } from "express";
import {
  cancelSubscription,
  createCheckoutSession,
  getSubscription,
  verifyPayment,
} from "../controllers/subscription.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/subscription", requireAuth, getSubscription);
router.post("/subscription/checkout", requireAuth, createCheckoutSession);
router.post("/subscription/verify", requireAuth, verifyPayment);
router.post("/subscription/cancel", requireAuth, cancelSubscription);

export default router;
