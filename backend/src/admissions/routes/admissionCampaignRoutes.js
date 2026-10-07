import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  createCampaign,
  getCampaigns,
  getActiveCampaignPublic,
} from "../controller/admissionCampaignController.js";

// Gated router — Registrar manages campaigns.
const router = express.Router();
router.use(protect, requireRole("registrar", "admin"));
router.post("/", createCampaign);
router.get("/", getCampaigns);

// Public router — no auth at all, mounted at a separate path in app.js so
// the two never share a base path/gate by accident.
export const publicAdmissionCampaignRouter = express.Router();
publicAdmissionCampaignRouter.get("/active", getActiveCampaignPublic);

export default router;
