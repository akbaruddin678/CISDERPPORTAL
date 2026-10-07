import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  trashAdmissionRecord,
  getTrashList,
  restoreAdmissionRecord,
  permanentlyDeleteAdmissionRecord,
  getAdmissionProcessStats,
  completeAdmission,
  getCompletedAdmissions,
} from "../controller/admissionTrashController.js";

const router = express.Router();
router.use(protect, requireRole("admission", "admin"));

router.get("/stats", getAdmissionProcessStats);
router.get("/completed", getCompletedAdmissions);
router.get("/", getTrashList);
router.post("/:admissionId/complete", completeAdmission);
router.post("/:admissionId", trashAdmissionRecord);
router.patch("/:id/restore", restoreAdmissionRecord);
router.delete("/:id", permanentlyDeleteAdmissionRecord);

export default router;
