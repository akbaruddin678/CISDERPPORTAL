import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { resolveHodDepartment } from "../../course/middleware/courseAssignmentScope.js";
import {
  getScheduledExams,
  getExamRoster,
  saveExamMarks,
  markExamComplete,
  publishExamMarks,
  getSubmissionsForReview,
  getSubmissionRosterForReview,
  reviewMarksSubmission,
  getDepartmentResultsOverview,
} from "../controllers/teacherMarksController.js";
import {
  createGradeCorrectionRequest,
  getMyGradeCorrectionRequests,
  getHodGradeCorrectionRequests,
  reviewGradeCorrectionRequest,
} from "../controllers/gradeCorrectionController.js";

const router = express.Router();

router.use(
  protect,
  requireRole(
    "teacher",
    "hod",
    "head_of_academia",
    "vc",
    "vice_vc",
    "registrar",
    "admin",
  ),
);

router.get("/scheduled-exams", getScheduledExams);
router.get("/exam-roster", getExamRoster);
router.post("/save-exam-marks", saveExamMarks);
router.post("/complete-exam", markExamComplete);
router.post("/publish-exam-marks", publishExamMarks);
router.post("/corrections", requireRole("teacher", "admin"), createGradeCorrectionRequest);
router.get("/corrections/mine", requireRole("teacher", "admin"), getMyGradeCorrectionRequests);
router.get("/hod/corrections", requireRole("hod", "admin"), resolveHodDepartment, getHodGradeCorrectionRequests);
router.patch("/hod/corrections/:id", requireRole("hod", "admin"), resolveHodDepartment, reviewGradeCorrectionRequest);

// HOD stage — department-scoped.
router.get(
  "/hod/submissions",
  requireRole("hod", "admin"),
  resolveHodDepartment,
  getSubmissionsForReview,
);
router.get(
  "/hod/submissions/:id/roster",
  requireRole("hod", "admin"),
  resolveHodDepartment,
  getSubmissionRosterForReview,
);
router.patch(
  "/hod/submissions/:id/review",
  requireRole("hod", "admin"),
  reviewMarksSubmission,
);
router.get(
  "/hod/results-overview",
  requireRole("hod", "admin"),
  resolveHodDepartment,
  getDepartmentResultsOverview,
);

// Head of Academia stage — university-wide, no department scoping.
router.get(
  "/academia/submissions",
  requireRole("head_of_academia", "admin"),
  getSubmissionsForReview,
);
router.get(
  "/academia/submissions/:id/roster",
  requireRole("head_of_academia", "admin"),
  getSubmissionRosterForReview,
);
router.patch(
  "/academia/submissions/:id/review",
  requireRole("head_of_academia", "admin"),
  reviewMarksSubmission,
);

// VC stage — final approval, university-wide.
router.get(
  "/vc/submissions",
  requireRole("vc", "vice_vc", "admin"),
  getSubmissionsForReview,
);
router.get(
  "/vc/submissions/:id/roster",
  requireRole("vc", "vice_vc", "admin"),
  getSubmissionRosterForReview,
);
router.patch(
  "/vc/submissions/:id/review",
  requireRole("vc", "vice_vc", "admin"),
  reviewMarksSubmission,
);

// Registrar — read-only visibility into the same submissions list/roster,
// no review route (registrar never approves/returns).
router.get(
  "/registrar/submissions",
  requireRole("registrar", "admin"),
  getSubmissionsForReview,
);
router.get(
  "/registrar/submissions/:id/roster",
  requireRole("registrar", "admin"),
  getSubmissionRosterForReview,
);

export default router;
