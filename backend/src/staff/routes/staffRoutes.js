import express from "express";
import {
  getAllStaff, // ✅ Import the new GET controller
} from "../controllers/staffController.js";
import {
  assignTeacherToClass,
  getMyAssignedCourses,
  getTeacherDashboardStats,
  getMyStaffProfile,
  getMyTimetable,
} from "../controllers/courseAssignmentController.js";


import { protect, requireRole } from "../../core/middleware/auth.js";

const router = express.Router();


router.get("/", protect, getAllStaff);


router.post("/assign-class", protect, assignTeacherToClass);

// Teacher: view my own assigned courses (current session + history)
router.get(
  "/my-courses",
  protect,
  requireRole("teacher", "admin"),
  getMyAssignedCourses,
);

// Teacher: dashboard KPI stats for the "My Classes & Schedule" home hub
router.get(
  "/my-dashboard-stats",
  protect,
  requireRole("teacher", "admin"),
  getTeacherDashboardStats,
);

// Teacher: my own full profile (identity, contact, academic/employment
// details, document vault) for the standalone "My Profile" page.
router.get(
  "/my-profile",
  protect,
  requireRole("teacher", "admin"),
  getMyStaffProfile,
);

// Teacher: my own weekly timetable (day, slot, room per assigned course).
router.get(
  "/my-timetable",
  protect,
  requireRole("teacher", "admin"),
  getMyTimetable,
);

export default router;
