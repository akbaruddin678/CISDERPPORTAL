import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  createJobPosting,
  getJobPostings,
  updateJobPostingStatus,
  addJobApplication,
  getJobApplications,
  updateApplicationStatus,
} from "../controller/recruitmentController.js";

const router = express.Router();
router.use(protect, requireRole("hr", "admin"));

router.post("/postings", createJobPosting);
router.get("/postings", getJobPostings);
router.patch("/postings/:id/status", updateJobPostingStatus);

router.post("/applications", addJobApplication);
router.get("/applications", getJobApplications);
router.patch("/applications/:id", updateApplicationStatus);

export default router;
