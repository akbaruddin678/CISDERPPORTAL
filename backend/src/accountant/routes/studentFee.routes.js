import express from "express";
import {
  upsertStudentFee,
  getStudentFees,
  deleteStudentFee,
  bulkCreateStudentFees,
  assignFeeSemester,
} from "../controller/studentFee.controller.js";
import { validateObjectIds } from "../middleware/validation.js";

const router = express.Router();

// Assign/Update Fee for a Student
router.post("/", upsertStudentFee);
router.post("/bulk", bulkCreateStudentFees);
// Get Fees for a Student
router.get("/:studentId", validateObjectIds(["studentId"]), getStudentFees);

// Permanently tag a legacy (untagged) fee record with its real semester
router.patch(
  "/:id/assign-semester",
  validateObjectIds(["id"]),
  assignFeeSemester,
);

// Delete Fee
router.delete("/:id", validateObjectIds(["id"]), deleteStudentFee);

export default router;
