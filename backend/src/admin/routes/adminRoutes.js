import express from "express";
import {
  createStaffUser,
  assignRoles,
  createRole,
  createDepartment,
  createProgram,
  createTerm,
  createSemester,
  getTermById,
  updateTerm,
  deleteTerm,
  listAllTermsAdmin,
} from "../controller/adminController.js";
import { protect, requireRole } from "../../core/middleware/auth.js";

const router = express.Router();

router.use(protect, requireRole("admin"));

router.post("/staff", createStaffUser);
router.patch("/users/:userId/roles", assignRoles);

router.post("/roles", createRole);

router.post("/departments", createDepartment);
router.post("/programs", createProgram);
router.post("/terms", createTerm);
router.get("/terms", listAllTermsAdmin);
router.post("/semesters", createSemester);
router.get("/terms/:id", getTermById);
router.patch("/terms/:id", updateTerm);
router.delete("/terms/:id", deleteTerm); 
export default router;
