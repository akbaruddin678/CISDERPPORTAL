// src/hr/routes/hrRoutes.js
import express from "express";
import multer from "multer";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  updateProfileDetails,
  updateContract,
  getEmploymentInfo,
  updateEmploymentInfo,
  updateOnboardingChecklist,
  registerBiometricId,
  updateStaffRoles,
  ensureStaffProfile,
  updateStaffStatus,
  deleteStaff,
  getHrDashboardStats,
  getOnboardingRequests,
  getOnboardingRequestById,
  rejectOnboardingRequest,
} from "../controller/hrStaffController.js";
import {
  uploadStaffDocument,
  getStaffDocuments,
  verifyStaffDocument,
  deleteStaffDocument,
} from "../controller/hrDocumentController.js";

// Document Vault uploads — PDFs/images, larger cap than a profile photo
// since these are transcripts, contracts, scanned CNICs, etc.
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowed.includes(file.mimetype)) return cb(new Error("Invalid file type"), false);
    cb(null, true);
  },
});

// Onboarding wizard upload — a single profile photo (images only) plus up
// to 10 Document Vault files (PDF/images) attached in the same submit,
// combined via a fieldname-aware filter since multer.fields() shares one
// fileFilter across every field.
const onboardingUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const imageTypes = ["image/png", "image/jpeg", "image/jpg"];
    const docTypes = [...imageTypes, "application/pdf"];
    const allowed = file.fieldname === "profilePhoto" ? imageTypes : docTypes;
    if (!allowed.includes(file.mimetype)) return cb(new Error("Invalid file type"), false);
    cb(null, true);
  },
});

const router = express.Router();


router.use(protect, requireRole("hr", "admin"));

router.get("/staff", getAllStaff);
router.get("/staff/:id", getStaffById);
router.post(
  "/staff",
  onboardingUpload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  createStaff,
);
router.put("/staff/:id", updateStaff);
router.patch("/staff/:id/profile-details", updateProfileDetails);
router.patch("/staff/:id/contract", updateContract);
router.get("/staff/:id/employment-info", getEmploymentInfo);
router.patch("/staff/:id/employment-info", updateEmploymentInfo);
router.patch("/staff/:id/onboarding-checklist", updateOnboardingChecklist);
router.patch("/staff/:id/biometric", registerBiometricId);
router.post("/staff/ensure-profile/:userId", ensureStaffProfile);
router.patch("/staff/:id/roles", updateStaffRoles);
router.patch("/staff/:id/status", updateStaffStatus);
router.delete("/staff/:id", deleteStaff);

// Document Vault
router.post("/staff/:id/documents", documentUpload.single("file"), uploadStaffDocument);
router.get("/staff/:id/documents", getStaffDocuments);
router.patch("/staff/:id/documents/:docId/verify", verifyStaffDocument);
router.delete("/staff/:id/documents/:docId", deleteStaffDocument);

router.get("/dashboard-stats", getHrDashboardStats);

// Pending requests submitted from the public, unauthenticated
// /teacher-onboarding page — reviewed here, approved by navigating to the
// real onboarding wizard with the request's data pre-filled.
router.get("/onboarding-requests", getOnboardingRequests);
router.get("/onboarding-requests/:id", getOnboardingRequestById);
router.patch("/onboarding-requests/:id/reject", rejectOnboardingRequest);

export default router;
