import express from "express";
import multer from "multer";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  getLectures,
  getLectureById,
  createLecture,
  updateLecture,
  deleteLecture,
} from "../controllers/lectureController.js";

// Lecture attachments intentionally accept a broad range of types (slides,
// spreadsheets, documents, images, audio, video) — no fileFilter restriction,
// just a generous per-file size cap since lecture videos can be large.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB per file
});

const router = express.Router();

router.use(protect, requireRole("teacher", "admin"));

router.get("/", getLectures);
router.get("/:id", getLectureById);
router.post("/", upload.array("files", 10), createLecture);
router.put("/:id", upload.array("files", 10), updateLecture);
router.delete("/:id", deleteLecture);

export default router;
