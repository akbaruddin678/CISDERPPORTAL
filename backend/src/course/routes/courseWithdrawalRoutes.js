import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { resolveHodDepartment } from "../middleware/courseAssignmentScope.js";
import {
  getWithdrawableRegistrations,
  createCourseWithdrawal,
  getCourseWithdrawalRegister,
} from "../controllers/courseAssignmentController.js";

const router = express.Router();
router.use(protect, requireRole("hod", "admin", "registrar"));

// HOD stage — the sole decision-maker, department-scoped.
router.get(
  "/eligible",
  requireRole("hod", "admin"),
  resolveHodDepartment,
  getWithdrawableRegistrations,
);
router.post(
  "/",
  requireRole("hod", "admin"),
  resolveHodDepartment,
  createCourseWithdrawal,
);

// Registrar stage — read-only register, unscoped.
router.get("/register", requireRole("registrar", "admin"), getCourseWithdrawalRegister);

export default router;
