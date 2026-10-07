import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { resolveHodDepartment } from "../../course/middleware/courseAssignmentScope.js";
import {
  submitLeaveRequest,
  getMyLeaveRequests,
  cancelLeaveRequest,
  getAllLeaveRequestsForHod,
  reviewLeaveRequestAsHod,
  getAllLeaveRequestsForHr,
  reviewLeaveRequestAsHr,
} from "../controllers/staffLeaveController.js";

const router = express.Router();
// Base gate widened to include "hod"/"hr" for the /hod/* and /hr/* review
// routes below — the teacher-facing routes re-narrow with their own
// requireRole so they stay off-limits to hod/hr.
router.use(protect, requireRole("teacher", "hod", "hr", "admin"));

router.post("/", requireRole("teacher", "admin"), submitLeaveRequest);
router.get("/my-requests", requireRole("teacher", "admin"), getMyLeaveRequests);
router.delete("/:id", requireRole("teacher", "admin"), cancelLeaveRequest);

// HOD stage — Pending -> Approved_HOD / Rejected, department-scoped.
router.get(
  "/hod/all",
  requireRole("hod", "admin"),
  resolveHodDepartment,
  getAllLeaveRequestsForHod,
);
router.patch(
  "/hod/:id/review",
  requireRole("hod", "admin"),
  resolveHodDepartment,
  reviewLeaveRequestAsHod,
);

// HR stage — Approved_HOD -> Approved_HR / Rejected.
router.get("/hr/all", requireRole("hr", "admin"), getAllLeaveRequestsForHr);
router.patch("/hr/:id/review", requireRole("hr", "admin"), reviewLeaveRequestAsHr);

export default router;
