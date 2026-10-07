import express from "express";
import { protectLMS } from "../../student/middleware/lmsAuth.js";
import {
  getAnnouncements,
  getUpcomingEvents,
} from "../controllers/lmsDashboardController.js";

const router = express.Router();

// Protect these routes so only logged-in LMS students can access them
router.use(protectLMS);

// Routes
router.get("/announcements", getAnnouncements);
router.get("/events/upcoming", getUpcomingEvents);

export default router;
