import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  getUFMReports,
  updateUFMDecision,
  getReEvaluations,
  updateReEvaluation,
  createUFMReportManual,
  deleteUFMReport,
} from "../controllers/postExamController.js";

const router = express.Router();
// Previously had no auth at all.
router.use(protect, requireRole("manager", "admin"));

// UFM Routes
router.get("/ufm", getUFMReports);
router.put("/ufm/:id", updateUFMDecision);

// Re-Evaluation Routes
router.get("/appeals", getReEvaluations);
router.put("/appeals/:id", updateReEvaluation);

router.post("/ufm", createUFMReportManual);
router.delete("/ufm/:id", deleteUFMReport);

export default router;
