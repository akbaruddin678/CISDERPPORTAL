import express from "express";
import { protect } from "../../core/middleware/auth.js";
import {
  trashStudent,
  bulkTrashStudents,
  getStudentTrashList,
  restoreStudent,
  permanentlyDeleteStudent,
} from "../controller/studentTrashController.js";

// Mounted as its own top-level prefix (/api/student-trash), same as
// admissions' /api/admissions/trash — keeps this entirely separate from
// /api/student's own "/:studentId" routes so there's no risk of "/bulk" or
// "/:id/restore" ever being matched as a studentId by route ordering.
const router = express.Router();
router.use(protect);

router.get("/", getStudentTrashList);
router.post("/bulk", bulkTrashStudents);
router.post("/:studentId", trashStudent);
router.patch("/:id/restore", restoreStudent);
router.delete("/:id", permanentlyDeleteStudent);

export default router;
