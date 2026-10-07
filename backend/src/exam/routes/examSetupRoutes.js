import express from "express";
import {
  getExamHalls,
  createExamHall,
} from "../controllers/examSetupController.js";

const router = express.Router();
router.get("/halls", getExamHalls);
router.post("/halls", createExamHall);
export default router;
