import express from "express";
import { protect } from "../../core/middleware/auth.js";
import { getLatestChallan } from "../controller/challanController.js";

const router = express.Router();

router.use(protect);

// Only one route to get the latest challan by User ID
router.get("/latest/:userId", getLatestChallan);

export default router;
