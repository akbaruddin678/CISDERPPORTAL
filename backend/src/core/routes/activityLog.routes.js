import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import {
  getActivityLogs,
  exportActivityLogs,
  getActivityLogMeta,
  reviewActivityLog,
  unreviewActivityLog,
} from "../controllers/activityLog.controller.js";

const router = express.Router();

// Seeing what every user has done across the whole system is admin-only.
router.use(protect, requireRole("admin"));

router.get("/", getActivityLogs);
router.get("/export", exportActivityLogs);
router.get("/meta", getActivityLogMeta);
router.patch("/:id/review", reviewActivityLog);
router.patch("/:id/unreview", unreviewActivityLog);

export default router;
