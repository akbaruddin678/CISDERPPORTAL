import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { resolveHodDepartment } from "../../course/middleware/courseAssignmentScope.js";
import {
  getUFMReportsForHod,
  reviewUFMReportAsHod,
  getReEvaluationsForHod,
  reviewReEvaluationAsHod,
} from "../controllers/postExamController.js";

const router = express.Router();
router.use(protect, requireRole("hod", "admin"), resolveHodDepartment);

router.get("/ufm", getUFMReportsForHod);
router.patch("/ufm/:id/review", reviewUFMReportAsHod);

router.get("/appeals", getReEvaluationsForHod);
router.patch("/appeals/:id/review", reviewReEvaluationAsHod);

export default router;
