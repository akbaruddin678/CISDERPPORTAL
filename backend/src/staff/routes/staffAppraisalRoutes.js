import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  getMyAppraisals,
  submitSelfAssessment,
  getAppraisalsToReview,
  submitEvaluatorScore,
} from "../controllers/staffAppraisalController.js";

const router = express.Router();
// Any real staff role can reach these — ownership (staffId/evaluatorId
// matching the caller's own StaffProfile, enforced in the controller) is
// what actually gates each record, not the role itself, since an
// evaluator isn't always an HOD.
router.use(
  protect,
  requireRole(
    "teacher",
    "hod",
    "course coordinator",
    "head_of_academia",
    "vc",
    "registrar",
    "accountant",
    "hr",
    "exam",
    "manager",
    "staff",
    "admin",
  ),
);

router.get("/mine", getMyAppraisals);
router.patch("/:id/self-assessment", submitSelfAssessment);
router.get("/to-review", getAppraisalsToReview);
router.patch("/:id/evaluate", submitEvaluatorScore);

export default router;
