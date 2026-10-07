import express from "express";
import {
  getMyPortalChallans,
  getAdminStudentsFeeOverview,
  getAdminSingleStudentFeeDetail,
} from "../controller/websitePortalFee.controller.js";

import { authenticate, authorize } from "../middleware/auth.js";

// ✅ 1. IMPORT THE NEW STUDENT MIDDLEWARE
import { authenticateStudent } from "../middleware/studentAuth.js";

const router = express.Router();

// ----------------------------------------------------
// 1. STUDENT PORTAL ROUTES
// ----------------------------------------------------
// ✅ 2. PUT THE GUARD BACK IN FRONT OF THE ROUTE
router.get("/student/my-challans", authenticateStudent, getMyPortalChallans);

// ----------------------------------------------------
// 2. ADMIN PORTAL ROUTES (Read-Only)
// ----------------------------------------------------
router.get(
  "/admin/students-fee-overview",
//  authenticate,
 
  getAdminStudentsFeeOverview,
);

router.get(
  "/admin/students-fee-overview/:id",
  // authenticate,
  getAdminSingleStudentFeeDetail,
);

export default router;
