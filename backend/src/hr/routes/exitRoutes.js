import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  createExitRecord,
  getExitRecords,
  updateExitRecord,
} from "../controller/exitController.js";

const router = express.Router();
router.use(protect, requireRole("hr", "admin"));

router.post("/", createExitRecord);
router.get("/", getExitRecords);
router.patch("/:id", updateExitRecord);

export default router;
