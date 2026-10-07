import express from "express";
import {
  getLmsAccounts,
  updateLmsCredentials,
  toggleLmsStatus,
  bulkGenerateLmsEmails,
  bulkResetLmsPasswords,
} from "../controller/lmsManagementController.js";
import { protect, requireRole } from "../../core/middleware/auth.js";

const router = express.Router();

router.use(protect, requireRole("admin"));

router.get("/accounts", getLmsAccounts);
router.put("/accounts/:authId", updateLmsCredentials);
router.post("/accounts/toggle-status", toggleLmsStatus); // For single & bulk
router.post("/accounts/generate-email", bulkGenerateLmsEmails); // For single & bulk
router.post("/accounts/reset-password", bulkResetLmsPasswords); // For single & bulk

export default router;
