import express from "express";
import multer from "multer";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  createComplianceReport,
  getComplianceReports,
  markReportSubmitted,
} from "../controller/complianceController.js";

const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();
router.use(protect);

// Read access is also given to the Vice Chancellor's office (executive
// oversight of accreditation status) — creating a report and marking one
// submitted stay Registrar/admin-only, so this is deliberately split
// instead of one requireRole(...) covering the whole router.
router.get("/", requireRole("registrar", "admin", "vc", "vice_vc"), getComplianceReports);
router.post("/", requireRole("registrar", "admin"), createComplianceReport);
router.patch(
  "/:id/submit",
  requireRole("registrar", "admin"),
  fileUpload.single("file"),
  markReportSubmitted,
);

export default router;
