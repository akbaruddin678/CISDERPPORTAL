import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  createNotification,
  getMyTeacherNotifications,
  listNotifications,
  searchRecipients,
  setNotificationActive,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/mine", protect, requireRole("teacher"), getMyTeacherNotifications);

router.use(protect, requireRole("vc", "vice_vc", "registrar", "hr"));
router.get("/", listNotifications);
router.get("/recipients", searchRecipients);
router.post("/", createNotification);
router.patch("/:id/active", setNotificationActive);

export default router;
