import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { resolveHodDepartment } from "../../course/middleware/courseAssignmentScope.js";
import {
  getHodStudentPrograms,
  getHodStudentsByProgram,
  getHodStudentProfile,
} from "../controller/hodStudentController.js";

const router = express.Router();

// Read-only, department-scoped. `resolveHodDepartment` resolves the HOD's own
// department from their StaffProfile server-side (never from a client param);
// admin/vc/vice_vc are left unscoped (see resolveHodDepartment) — the VC
// portal's own Student Directory reuses this exact endpoint.
router.use(
  protect,
  requireRole("hod", "admin", "vc", "vice_vc"),
  resolveHodDepartment,
);

// Static routes first so "/programs" isn't captured by "/:studentId".
router.get("/programs", getHodStudentPrograms);
router.get("/", getHodStudentsByProgram);
router.get("/:studentId", getHodStudentProfile);

export default router;
