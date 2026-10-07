import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { resolveHodDepartment } from "../../course/middleware/courseAssignmentScope.js";
import {
  getSchedulableAssignments,
  getTimetableEntries,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
} from "../controller/timetableController.js";

const router = express.Router();
router.use(protect);

// Reads: Registrar/Admin see everything, an HOD is scoped to their own
// department (via resolveHodDepartment), and Exam staff (manager) get
// read-only university-wide access for the Exam module's timetable browser.
router.get(
  "/assignments",
  requireRole("registrar", "admin", "hod", "manager"),
  resolveHodDepartment,
  getSchedulableAssignments,
);
router.get(
  "/",
  requireRole("registrar", "admin", "hod", "manager"),
  resolveHodDepartment,
  getTimetableEntries,
);

// Writes: Registrar/Admin schedule university-wide; an HOD can also
// create/manage entries, scoped to their own department. Exam staff cannot
// write — they only browse the published schedule.
router.post(
  "/",
  requireRole("registrar", "admin", "hod"),
  resolveHodDepartment,
  createTimetableEntry,
);
router.patch(
  "/:id",
  requireRole("registrar", "admin", "hod"),
  resolveHodDepartment,
  updateTimetableEntry,
);
router.delete(
  "/:id",
  requireRole("registrar", "admin", "hod"),
  resolveHodDepartment,
  deleteTimetableEntry,
);

export default router;
