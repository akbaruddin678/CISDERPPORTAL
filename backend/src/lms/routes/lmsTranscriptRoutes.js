import express from "express";
import { protectStudent } from "../middleware/studentAuth.js";
import { getMyTranscripts } from "../controllers/lmsTranscriptController.js";

const router = express.Router();

// Protect all routes in this file with the Student Token middleware
router.use(protectStudent);

router.get("/my-results", getMyTranscripts);

export default router;
