import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  createAlumniProfile,
  getAlumniProfiles,
  updateAlumniProfile,
} from "../controller/alumniController.js";

const router = express.Router();
router.use(protect, requireRole("registrar", "admin"));

router.get("/", getAlumniProfiles);
router.post("/", createAlumniProfile);
router.patch("/:id", updateAlumniProfile);

export default router;
