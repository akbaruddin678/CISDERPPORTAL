import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  createSubstitutionRequest,
  getMySubstitutionRequests,
  getOpenSubstitutionRequests,
  acceptSubstitutionRequest,
  cancelSubstitutionRequest,
} from "../controllers/classSubstitutionController.js";

const router = express.Router();
router.use(protect, requireRole("teacher", "admin"));

router.post("/", createSubstitutionRequest);
router.get("/my-requests", getMySubstitutionRequests);
router.get("/open", getOpenSubstitutionRequests);
router.patch("/:id/accept", acceptSubstitutionRequest);
router.delete("/:id", cancelSubstitutionRequest);

export default router;
