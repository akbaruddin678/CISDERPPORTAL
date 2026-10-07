import express from "express";
import { syncStudentFromCollege } from "../controller/collegeSyncController.js";
const router = express.Router();

// Middleware to protect the webhook route
const verifyWebhookSecret = (req, res, next) => {
  const secret = req.headers["x-sync-secret"];
  // Check against your .env secret, or use a hardcoded fallback for dev
  const validSecret = process.env.ERP_SYNC_SECRET || "your_secret_key";

  if (secret !== validSecret) {
    return res
      .status(403)
      .json({
        success: false,
        message: "Unauthorized sync attempt. Invalid Secret Key.",
      });
  }
  next();
};

// Route: POST /api/external-sync/student
router.post("/student", verifyWebhookSecret, syncStudentFromCollege);

export default router;
