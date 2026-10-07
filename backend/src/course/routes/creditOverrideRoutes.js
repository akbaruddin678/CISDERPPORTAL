import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { grantCreditOverride } from "../controller/creditOverrideController.js";

const router = express.Router();
router.use(protect, requireRole("admin", "hod"));
router.post("/", grantCreditOverride);

export default router;
