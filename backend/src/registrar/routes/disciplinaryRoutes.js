import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  createDisciplinaryFile,
  getDisciplinaryFiles,
  updateDisciplinaryFile,
} from "../controller/disciplinaryController.js";

const router = express.Router();
router.use(protect, requireRole("registrar", "admin"));

router.get("/", getDisciplinaryFiles);
router.post("/", createDisciplinaryFile);
router.patch("/:id", updateDisciplinaryFile);

export default router;
