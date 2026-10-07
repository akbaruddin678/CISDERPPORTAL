import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { resolveHodDepartment } from "../middleware/courseAssignmentScope.js";
import {
  getAssignments,
  createAllocation,
  deleteAssignment,
  bulkDeleteAssignments,
  bulkUnassignInstructor,
  getAssignmentRoster,
  updateAssignmentRoster,
  getFacultyMonitoringOverview,
  getHodDashboardStats,
  getSemestersWithActiveStudents,
} from "../controllers/courseAssignmentController.js";

const router = express.Router();

// Only HOD, Admin, and Manager (Exam office) may view/manage course
// assignments. HODs are further scoped to their own department below.
router.use(protect, requireRole("hod", "admin", "manager"), resolveHodDepartment);

router.get("/", getAssignments);
router.post("/", createAllocation);
router.get("/monitoring", getFacultyMonitoringOverview);
router.get("/hod-dashboard-stats", getHodDashboardStats);
router.get("/semesters-with-active-students", getSemestersWithActiveStudents);

// Bulk routes must be registered before "/:id" so "bulk" isn't matched as an id
router.delete("/bulk", bulkDeleteAssignments);
router.patch("/bulk/unassign", bulkUnassignInstructor);

router.delete("/:id", deleteAssignment);
router.get("/:id/students", getAssignmentRoster);
router.put("/:id/students", updateAssignmentRoster);

export default router;
