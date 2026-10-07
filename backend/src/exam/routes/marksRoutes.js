import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  saveStudentMarks,
  submitResultForApproval,
  applyReEvaluation,
  generateAcademicRecords,
  getCourseStudents,
  getExamsForCourse,
  getCourseExamRoster,
  manualUploadExamMarks,
  getBatchCourses,
  getMarkConfig,
  saveMarkConfig,
} from "../controllers/marksController.js";
// Results now come from the real exam-instance/approval pipeline, not the
// legacy StudentCourseRegistration mid/final/sessional buckets.
import { getStudentResultsOverview } from "../controllers/teacherMarksController.js";

const router = express.Router();

// Admin/Exam-Cell only — this is the manual-override marks tool, kept
// separate from the teacher draft/publish/HOD-review pipeline. "manager" is
// the Exam Cell role — matches the requiredRoles already enforced on every
// /exam/* route in frontend/src/Admin/SupperAdmin/routes/adminRoutes.js.
router.use(protect, requireRole("manager", "admin"));

router.post("/save", saveStudentMarks);
router.post("/submit-approval", submitResultForApproval);
router.post("/re-evaluation", applyReEvaluation);
router.post("/generate-records", generateAcademicRecords);

// BULK ROUTES
router.get("/students", getCourseStudents);
router.get("/exams-for-course", getExamsForCourse);
router.get("/exam-roster", getCourseExamRoster);
router.post("/manual-upload", manualUploadExamMarks);
router.get("/courses", getBatchCourses);
router.get("/results", getStudentResultsOverview);

router.get("/config", getMarkConfig);
router.post("/config", saveMarkConfig);

export default router;
