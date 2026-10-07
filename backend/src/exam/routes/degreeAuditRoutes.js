import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { getAuditScope, runDegreeAudit } from "../controllers/degreeAuditController.js";

const router = express.Router();

// Controller of Exams (manager/exam) or admin only — matches
// graduationAccess.js::resolveViewer's existing "exam" desk definition
// (hasRole(user, "manager", "exam")).
router.use(protect, requireRole("admin", "manager", "exam"));

router.get("/scope", getAuditScope);
router.post("/run", runDegreeAudit);

export default router;
