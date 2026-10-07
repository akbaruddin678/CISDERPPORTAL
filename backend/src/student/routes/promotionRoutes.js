import express from "express";
import { promoteStudent } from "../controller/promotionController.js";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { bulkSemesterPromotion } from "../controller/semesterPromotionController.js";
import { admissionUpload } from "../../core/middleware/upload.js";


const router = express.Router();

// This was previously wide open to any authenticated user — writes
// StudentProfile.status/semesterId directly, so it's gated per-route below.
router.use(protect);

// Despite the "/promotion" namespace, /promote is the one-time "Get
// Admission" action that turns an accepted Admission into a StudentProfile
// (see promotionController.js::promoteStudent) — the frontend page that
// calls this (AdmissionDetailView.jsx's "Get Admission" button) is itself
// only reachable by "accountant"/"admission" (adminRoutes.js), so those are
// the roles that actually need to call it. Real semester-to-semester
// promotion of already-enrolled students (/bulk-move) is a distinct action
// and keeps its own, narrower Examination-Office-style role list (mirrors
// graduation/services/graduationAccess.js's role definition).
router.post(
  "/promote",
  requireRole("admin", "registrar", "accountant", "admission"),
  admissionUpload.single("proofFile"),
  promoteStudent,
);
router.post(
  "/bulk-move",
  requireRole("admin", "registrar", "hod", "manager", "exam"),
  bulkSemesterPromotion,
);

export default router;