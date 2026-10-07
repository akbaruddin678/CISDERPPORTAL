import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  markAttendance,
  getAttendanceForDate,
  getMonthlySummary,
} from "../controller/staffAttendanceController.js";

const router = express.Router();
router.use(protect, requireRole("hr", "admin"));

router.post("/mark", markAttendance);
router.get("/by-date", getAttendanceForDate);
router.get("/monthly-summary", getMonthlySummary);

export default router;
