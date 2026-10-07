import express from "express";
import {
  processStudentLeft,
  getLeftStudentsList,
  getLeftStudentsStats,
  updateLeftStudentDetails,
} from "../controller/studentLeft.controller.js";


import { admissionUpload } from "../../core/middleware/upload.js";


import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize("admin", "accountant"));

router.get("/left/stats", getLeftStudentsStats);


router.get("/left", getLeftStudentsList);


router.put(
  "/:id/leave",
  admissionUpload.single("proofDocument"),
  processStudentLeft,
);


router.patch(
  "/:id/leave/update",
  admissionUpload.single("proofDocument"),
  updateLeftStudentDetails,
);

export default router;
