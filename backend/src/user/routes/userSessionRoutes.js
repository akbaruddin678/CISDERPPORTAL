import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  getActiveSessions,
  revokeSession,
} from "../controller/userSessionController.js";

const router = express.Router();

// Seeing (and force-logging-out) every currently logged-in user is
// admin-only.
router.use(protect, requireRole("admin"));

router.get("/", getActiveSessions);
router.delete("/:id", revokeSession);

export default router;
