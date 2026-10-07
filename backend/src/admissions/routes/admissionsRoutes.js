import express from "express";
import { protect } from "../../core/middleware/auth.js";
import { admissionUpload } from "../../core/middleware/upload.js";
import {
  getMyAdmission,
  saveDraftStep,
  uploadAdmissionDocument,
  finalSubmitAdmission,
  getAdmissionList,
  getAdmissionDetails,
  updateAdmissionRemark,
  deleteAdmission,
  deleteSessionAdmissions,
} from "../controller/admissionsController.js";

const router = express.Router();
router.use(protect);

// Student Routes
router.get("/applications/me", getMyAdmission);
router.post("/applications/draft", saveDraftStep);
router.post(
  "/applications/upload",
  admissionUpload.single("file"),
  uploadAdmissionDocument
);
router.post("/applications/submit", finalSubmitAdmission);

// Admin Routes
router.get("/admission-list", getAdmissionList);
router.get("/admission-details/:admissionId", getAdmissionDetails);
router.patch("/:admissionId/remark", updateAdmissionRemark);
router.delete("/:admissionId", deleteAdmission);
router.delete("/session/:sessionId", deleteSessionAdmissions);

export default router;
