import express from "express";
import { protectStudent } from "../middleware/studentAuth.js";
import {
  getAvailableCourses,
  registerCourses,

} from "../controllers/lmsCourseController.js";
import {
  getMyTimetable,
  getClassroomMaterials,
  getMyDateSheet,
} from "../controllers/lmsAcademicsController.js";
const router = express.Router();

router.use(protectStudent);
router.get("/available", getAvailableCourses);


router.get("/timetable", getMyTimetable);
router.get("/classroom/:courseId", getClassroomMaterials);
router.get("/datesheet", getMyDateSheet);
router.post("/register", registerCourses);
export default router;
