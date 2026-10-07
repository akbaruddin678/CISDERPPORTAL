import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { resolveHodDepartment } from "../../course/middleware/courseAssignmentScope.js";
import { getExamScheduleForHod } from "../controllers/examController.js";

const router = express.Router();
router.use(protect, requireRole("hod", "admin"), resolveHodDepartment);

router.get("/schedule", getExamScheduleForHod);

export default router;
