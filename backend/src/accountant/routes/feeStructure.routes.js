import express from "express";
import {
  // Heads
  createFeeHead,
  getFeeHeads,

  // Academic
  createAcademicFee,
  getAcademicFees,
  updateAcademicFee,
  deleteAcademicFee,

  // Basic
  createBasicFee,
  getBasicFees,
  updateBasicFee,
  deleteBasicFee,

  // Admission
  createAdmissionFee,
  getAdmissionFees,
  updateAdmissionFee,
  deleteAdmissionFee,

  // Re-Admission
  createReAdmissionFee,
  getReAdmissionFees,
  updateReAdmissionFee,
  deleteReAdmissionFee,

  // Exam
  createExamFee,
  getExamFees,
  updateExamFee,
  deleteExamFee,

  // Misc
  createMiscellaneousFee,
  getMiscellaneousFees,
  deleteMiscellaneousFee
} from "../controller/feeStructure.controller.js";

// Ensure this path points to your actual validation middleware
import { requireFields, validateObjectIds } from "../middleware/validation.js";

const router = express.Router();

// ==========================================
// 1. FEE HEADS
// ==========================================
router.post("/heads", requireFields(["name", "type"]), createFeeHead);
router.get("/heads", getFeeHeads);

// ==========================================
// 2. ACADEMIC (Tuition/Semester)
// ==========================================
router.post(
  "/academic",
  requireFields(["programId", "termId", "semesterNumber", "totalAmount"]),
  createAcademicFee
);
router.get("/academic", getAcademicFees);
router.put("/academic/:id", validateObjectIds("id"), updateAcademicFee);
router.delete("/academic/:id", validateObjectIds("id"), deleteAcademicFee);

// ==========================================
// 2B. BASIC (Per-Semester Baseline)
// ==========================================
router.post(
  "/basic",
  requireFields(["programId", "termId", "semesterNumber", "totalAmount"]),
  createBasicFee
);
router.get("/basic", getBasicFees);
router.put("/basic/:id", validateObjectIds("id"), updateBasicFee);
router.delete("/basic/:id", validateObjectIds("id"), deleteBasicFee);

// ==========================================
// 3. ADMISSION (One-Time)
// ==========================================
router.post(
  "/admission",
  requireFields(["programId", "termId", "totalAmount"]),
  createAdmissionFee
);
router.get("/admission", getAdmissionFees);
router.put("/admission/:id", validateObjectIds("id"), updateAdmissionFee);
router.delete("/admission/:id", validateObjectIds("id"), deleteAdmissionFee);

// ==========================================
// 4. RE-ADMISSION
// ==========================================
router.post(
  "/readmission",
  requireFields(["programId", "termId", "totalAmount"]),
  createReAdmissionFee
);
router.get("/readmission", getReAdmissionFees);
router.put("/readmission/:id", validateObjectIds("id"), updateReAdmissionFee);
router.delete("/readmission/:id", validateObjectIds("id"), deleteReAdmissionFee);

// ==========================================
// 5. EXAM FEE
// ==========================================
router.post(
  "/exam",
  requireFields(["programId", "termId", "totalAmount", "levelNumber"]),
  createExamFee
);
router.get("/exam", getExamFees);
router.put("/exam/:id", validateObjectIds("id"), updateExamFee);
router.delete("/exam/:id", validateObjectIds("id"), deleteExamFee);

// ==========================================
// 6. MISCELLANEOUS (General)
// ==========================================
router.post(
  "/misc",
  requireFields(["name", "amount"]),
  createMiscellaneousFee
);
router.get("/misc", getMiscellaneousFees);
router.delete("/misc/:id", validateObjectIds("id"), deleteMiscellaneousFee);

export default router;