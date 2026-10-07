import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  getGroupedRevenue,
  getSemesterStudents,
} from "../controller/revenueExplorer.controller.js";

const router = express.Router();

// Read-only (GET-only router) — the VC portal's Accounts module embeds
// this exact drill-down, so its role is allowed in too.
router.use(protect, requireRole("admin", "accountant", "headofaccount", "vc", "vice_vc"));

router.get("/grouped", getGroupedRevenue);
router.get("/semester-students", getSemesterStudents);

export default router;
