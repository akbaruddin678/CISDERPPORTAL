import express from "express";
import {
  studentLogin,
  updateStudentPassword,
} from "../controller/lmsAuthController.js";
import { protectLMS } from "../middleware/lmsAuth.js"; 

const router = express.Router();

// Public route
router.post("/login", studentLogin);


router.put("/update-password", protectLMS, updateStudentPassword);

export default router;
