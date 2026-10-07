import express from "express";
import { protectStudent } from "../middleware/studentAuth.js";
import {
  getMyChallans,
  getMyInstallmentPlan,
} from "../controllers/lmsFinanceController.js";

const router = express.Router();


router.use(protectStudent);


router.get("/my-challans", getMyChallans);
router.get("/my-installments", getMyInstallmentPlan);

export default router;
