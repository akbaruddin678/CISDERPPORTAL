import express from "express";
import {
  getStudentsForRegistration,
  getStudentCourseDetails,
  saveStudentRegistrations,
  getStudentCourseHistory,
  getCreditLimit,
} from "../controllers/studentCourseController.js";
import { protect, requireRole } from "../../core/middleware/auth.js";

const router = express.Router();

// Was previously wide open to any authenticated user (in fact, to anyone at
// all) — this writes StudentCourseRegistration directly, so it's gated to
// the roles who actually run course registration, same fix pattern as
// student/routes/promotionRoutes.js in Phase 1.
router.use(protect, requireRole("admin", "registrar", "exam", "manager"));

router.get("/students", getStudentsForRegistration);
router.get("/details", getStudentCourseDetails);
router.get("/credit-limit", getCreditLimit);
router.post("/save", saveStudentRegistrations);
router.get("/history/:studentId", getStudentCourseHistory);
export default router;
