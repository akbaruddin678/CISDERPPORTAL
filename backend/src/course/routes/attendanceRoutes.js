import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  getRoster,
  markAttendance,
  getClassReport,
  getStudentReport,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.use(protect, requireRole("teacher", "admin"));

router.get("/roster", getRoster);
router.post("/mark", markAttendance);
router.get("/class-report", getClassReport);
router.get("/student-report", getStudentReport);

export default router;
