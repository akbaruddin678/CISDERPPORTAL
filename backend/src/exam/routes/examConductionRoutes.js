import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { resolveHodDepartment } from "../../course/middleware/courseAssignmentScope.js";
import {
  reportUFM,
  getAttendanceRoster,
  saveAttendance,
  submitAttendanceForReview,
  getAttendanceSubmissionsForReview,
  getAttendanceRosterForReview,
  reviewAttendanceSubmission,
} from "../controllers/examConductionController.js";

const router = express.Router();
// Base gate widened to include "hod" for the new /attendance/hod/* review
// routes below — every other route here re-narrows with its own
// requireRole so nothing else becomes reachable by hod.
router.use(protect, requireRole("manager", "admin", "hod"));

router.post("/ufm", requireRole("manager", "admin"), reportUFM);

// Exam-Cell entry side — recording attendance, not the course's own teacher.
router.get("/attendance/roster", requireRole("manager", "admin"), getAttendanceRoster);
router.post("/attendance/save", requireRole("manager", "admin"), saveAttendance);
router.post(
  "/attendance/submit",
  requireRole("manager", "admin"),
  submitAttendanceForReview,
);

// HOD stage — department-scoped review.
router.get(
  "/attendance/hod/submissions",
  requireRole("hod", "admin"),
  resolveHodDepartment,
  getAttendanceSubmissionsForReview,
);
router.get(
  "/attendance/hod/submissions/:id/roster",
  requireRole("hod", "admin"),
  resolveHodDepartment,
  getAttendanceRosterForReview,
);
router.patch(
  "/attendance/hod/submissions/:id/review",
  requireRole("hod", "admin"),
  resolveHodDepartment,
  reviewAttendanceSubmission,
);

export default router;
