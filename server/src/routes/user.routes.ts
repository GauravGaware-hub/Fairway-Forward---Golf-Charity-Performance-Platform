import { Router } from "express";
import { getMe, updateMe } from "../controllers/user.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, updateMe);

// Admin-only route for testing requireAdmin authorization
router.get("/admin/test", requireAuth, requireAdmin, (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: "Admin access granted",
    },
  });
});

export default router;
