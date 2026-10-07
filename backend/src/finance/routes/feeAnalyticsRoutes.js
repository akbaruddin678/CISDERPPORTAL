import express from "express";
import { protect } from "../../core/middleware/auth.js"; // Ensure your auth middleware is imported
import {
  getFeeAnalytics,
  lockMonthAndGenerateReport,
} from "../controller/feeAnalyticsController.js";

const router = express.Router();

// Apply authentication middleware to all analytics routes
router.use(protect);

// Routes
router.get("/", getFeeAnalytics);
router.post("/lock-month", lockMonthAndGenerateReport);

export default router;
