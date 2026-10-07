import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  generatePayrollSlip,
  getPayrollSlips,
  updatePayrollStatus,
  suggestPayrollSlip,
} from "../controller/payrollController.js";

const router = express.Router();
router.use(protect, requireRole("hr", "admin"));

router.post("/", generatePayrollSlip);
router.get("/", getPayrollSlips);
router.patch("/:id/status", updatePayrollStatus);
router.get("/suggest/:staffId", suggestPayrollSlip);

export default router;
