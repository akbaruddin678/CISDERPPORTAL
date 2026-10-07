import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { createManualAdmission } from "../controller/manualAdmissionController.js";

const router = express.Router();
router.use(protect, requireRole("admission", "admin"));

router.post("/", createManualAdmission);

export default router;
