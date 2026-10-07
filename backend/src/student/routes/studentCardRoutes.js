import express from "express";
import multer from "multer";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  getCardData,
  saveStudentPhoto,
  issueCard,
  markPrinted,
  revokeCard,
  listCards,
  listStudentsForCards,
} from "../controller/studentCardController.js";

const router = express.Router();

// Photos are cropped and resized in the browser, so a small cap is plenty.
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

router.use(protect, requireRole("admission", "admin", "registrar"));

router.get("/", listCards);
router.get("/students", listStudentsForCards);
router.post("/", issueCard);
router.get("/student/:studentId", getCardData);
router.put("/student/:studentId/photo", photoUpload.single("photo"), saveStudentPhoto);
router.post("/:id/printed", markPrinted);
router.post("/:id/revoke", revokeCard);

export default router;
