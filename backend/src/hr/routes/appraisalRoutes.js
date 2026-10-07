import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  createAppraisal,
  getAppraisals,
  updateAppraisal,
} from "../controller/appraisalController.js";

const router = express.Router();
router.use(protect, requireRole("hr", "admin"));

router.post("/", createAppraisal);
router.get("/", getAppraisals);
router.patch("/:id", updateAppraisal);

export default router;
