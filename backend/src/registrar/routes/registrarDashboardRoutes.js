import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { getRegistrarDashboardStats } from "../controller/registrarDashboardController.js";

const router = express.Router();
router.use(protect, requireRole("registrar", "admin"));

router.get("/", getRegistrarDashboardStats);

export default router;
