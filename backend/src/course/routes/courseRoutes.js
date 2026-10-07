import express from "express";
import {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  assignCourseCode,
  updateAcademicRules,
} from "../controllers/courseController.js";
import { protect, requireRole } from "../../core/middleware/auth.js";

const router = express.Router();

router.use(protect);

// Any authenticated staff role may read the catalog (Admin/Registrar create
// and assign codes; HOD/Academia/VC just browse it).
router.get("/", getAllCourses);

router.post("/", requireRole("admin"), createCourse);
router.put("/:id", requireRole("admin"), updateCourse);
router.delete("/:id", requireRole("admin"), deleteCourse);

// Registrar assigns the official code, which activates the course.
router.patch(
  "/:id/assign-code",
  requireRole("admin", "registrar"),
  assignCourseCode,
);
router.patch(
  "/:id/academic-rules",
  requireRole("admin", "head_of_academia"),
  updateAcademicRules,
);

export default router;
