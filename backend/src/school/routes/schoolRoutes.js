import express from "express";
import multer from "multer";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { createSchool, deleteSchool, listPublicSchools, listSchools, updateSchool } from "../controller/schoolController.js";

const router = express.Router();
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, ["image/png", "image/jpeg"].includes(file.mimetype)),
});

router.get("/public", listPublicSchools);
router.get("/", protect, listSchools);
router.post("/", protect, requireRole("admin"), logoUpload.single("logo"), createSchool);
router.patch("/:id", protect, requireRole("admin"), logoUpload.single("logo"), updateSchool);
router.delete("/:id", protect, requireRole("admin"), deleteSchool);

export default router;
