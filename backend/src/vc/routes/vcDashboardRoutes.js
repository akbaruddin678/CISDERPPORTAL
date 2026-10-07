import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { getVcDashboardStats } from "../controller/vcDashboardController.js";

const router = express.Router();

// Read-only executive rollup — VC, Vice VC, and admin (for support/testing).
router.use(protect, requireRole("vc", "vice_vc", "admin"));

router.get("/dashboard-stats", getVcDashboardStats);

export default router;
