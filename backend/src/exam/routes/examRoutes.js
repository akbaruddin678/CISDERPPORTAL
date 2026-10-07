import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  saveSemesterExamPlan,
  publishExams,
  updateExam,
  deleteExam,
  getExams,
  getEligibleStudentsForAdmitCards,
  getAdmitCards,
  generateBulkAdmitCards,
  revokeAdmitCard,
  getDashboardStats,
  getSemestersWithActiveStudents,
} from "../controllers/examController.js";

const router = express.Router();

// Admin/Exam-Cell only — this whole router previously had no auth at all.
router.use(protect, requireRole("manager", "admin"));

router.get("/dashboard-stats", getDashboardStats);
router.get("/semesters-with-active-students", getSemestersWithActiveStudents);
router.post("/plan", saveSemesterExamPlan);
router.patch("/publish", publishExams);
router.put("/:id", updateExam);
router.delete("/:id", deleteExam);
router.get("/list", getExams);

// Must come before /admit-cards/generate since express matches in order,
// but these are distinct static/param segments so order doesn't actually
// collide — kept together for readability.
router.get("/admit-cards/eligible", getEligibleStudentsForAdmitCards);
router.get("/admit-cards", getAdmitCards);
router.post("/admit-cards/generate", generateBulkAdmitCards);
router.patch("/admit-cards/:id/revoke", revokeAdmitCard);

export default router;
