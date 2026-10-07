import express from "express";
import {
  // Plan CRUD
  createScholarshipPlan,
  getScholarshipPlans,
  getScholarshipPlanById,
  updateScholarshipPlan,
  deleteScholarshipPlan,
  toggleScholarshipPlanStatus,

  // Application Management
  applyForScholarship,
  getStudentApplications,
  getApplicationById,
  approveScholarship,
  rejectScholarship,
  revokeScholarship,

  // Student-specific
  getStudentScholarships,
  checkEligibility,
  getAvailablePlans,
  getStudentFeeContext,

  // Statistics
  getScholarshipStats,
} from "../controller/scholarship.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateObjectIds, requireFields } from "../middleware/validation.js";

const router = express.Router();

// ============ PUBLIC ROUTES ============
// Student applies for scholarship (needs authentication but not admin)
router.post(
  "/apply",
  authenticate,
  requireFields(["scholarshipPlanId"]),
  applyForScholarship
);

router.get(
  "/students/:studentId/scholarships",
  authenticate,
  getStudentScholarships
);

router.get(
  "/students/:studentId/available-plans",
  authenticate,
  getAvailablePlans
);

// Tuition/fee context for a student — powers the Scholarship Assignment
// and Approval flows' "how much fee does this student have" preview and
// the optional inline "set up fee" shortcut.
router.get(
  "/students/:studentId/fee-context",
  authenticate,
  getStudentFeeContext
);

router.post(
  "/check-eligibility",
  authenticate,
  requireFields(["scholarshipPlanId"]),
  checkEligibility
);

// ============ PROTECTED ROUTES ============
router.use(authenticate);

// Scholarship Plans (Admin only)
router.post(
  "/plans",
  authorize("accountant"),
  requireFields(["title", "type"]),
  createScholarshipPlan
);

router.get("/plans", getScholarshipPlans);
router.get("/plans/:id", validateObjectIds(["id"]), getScholarshipPlanById);
router.put(
  "/plans/:id",
  authorize("accountant"),
  validateObjectIds(["id"]),
  updateScholarshipPlan
);
router.delete(
  "/plans/:id",
  authorize("accountant"),
  validateObjectIds(["id"]),
  deleteScholarshipPlan
);
router.patch(
  "/plans/:id/status",
  authorize("accountant"),
  validateObjectIds(["id"]),
  toggleScholarshipPlanStatus
);

// Scholarship Applications (Admin can view all, students view their own)
router.get("/applications", getStudentApplications);
router.get("/applications/:id", validateObjectIds(["id"]), getApplicationById);
router.patch(
  "/applications/:id/approve",
  validateObjectIds(["id"]),
  approveScholarship
);
router.patch(
  "/applications/:id/reject",
  validateObjectIds(["id"]),
  rejectScholarship
);
router.patch(
  "/applications/:id/revoke",
  validateObjectIds(["id"]),
  revokeScholarship
);

// Statistics (Admin only)
router.get("/stats", authorize("accountant"), getScholarshipStats);

export default router;
