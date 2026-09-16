import { Router } from "express";
import {
  adminCreateCharity,
  adminDeleteCharity,
  adminUpdateCharity,
  getCharities,
  getCharityById,
  getMyCharity,
  updateMyCharity,
} from "../controllers/charity.controller.js";
import {
  requireActiveSubscription,
  requireAdmin,
  requireAuth,
} from "../middleware/auth.middleware.js";

const router = Router();

// Public directory endpoints
router.get("/charities", getCharities);
router.get("/charities/:id", getCharityById);

// Authenticated user charity selection
router.get("/me/charity", requireAuth, getMyCharity);
router.put("/me/charity", requireAuth, requireActiveSubscription, updateMyCharity);

// Admin Charity Management endpoints
router.post("/admin/charities", requireAuth, requireAdmin, adminCreateCharity);
router.patch("/admin/charities/:id", requireAuth, requireAdmin, adminUpdateCharity);
router.delete("/admin/charities/:id", requireAuth, requireAdmin, adminDeleteCharity);

export default router;
