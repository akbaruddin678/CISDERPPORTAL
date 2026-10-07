import express from "express";
import multer from "multer";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  extendDueDate,
  deleteAssignment,
} from "../controllers/assignmentController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB per file
});

const router = express.Router();

router.use(protect, requireRole("teacher", "admin"));

router.get("/", getAssignments);
router.get("/:id", getAssignmentById);
router.post("/", upload.array("files", 10), createAssignment);
router.put("/:id", upload.array("files", 10), updateAssignment);
router.patch("/:id/extend-due-date", extendDueDate);
router.delete("/:id", deleteAssignment);

export default router;
