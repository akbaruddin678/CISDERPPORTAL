import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  listRegulations,
  createOrUpdateRegulation,
  lockRegulation,
  unlockRegulation,
} from "../controller/programRegulationController.js";

const router = express.Router();

// Coarse gate: anyone who might legitimately view or act on regulations.
// Which specific action (edit vs. lock vs. unlock) each of these roles can
// actually do is decided inside the controller, same coarse-then-fine
// pattern as graduation/routes/graduationRoutes.js.
router.use(protect, requireRole("admin", "head_of_academia", "registrar", "vc", "vice_vc"));

router.get("/", listRegulations);
router.post("/", createOrUpdateRegulation);
router.patch("/:id/lock", lockRegulation);
router.patch("/:id/unlock", unlockRegulation);

export default router;
