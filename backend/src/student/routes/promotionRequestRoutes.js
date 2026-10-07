import express from "express";
import {
  getSemesterDefaulters,
  toggleStudentExemption,
  updateRequestStatus,
} from "../controller/promotionRequestController.js";
import { protect, requireRole } from "../../core/middleware/auth.js";

const router = express.Router();

// Was previously wide open to any authenticated user. This is accountant
// defaulter-exemption management (see comments below), so it's gated
// accordingly.
router.use(protect, requireRole("admin", "accountant"));

// Accountant Defaulter Management
router.get("/defaulters", getSemesterDefaulters);
router.post("/toggle-exemption", toggleStudentExemption);

// Legacy / Other
router.put("/:id/status", updateRequestStatus);

export default router;
