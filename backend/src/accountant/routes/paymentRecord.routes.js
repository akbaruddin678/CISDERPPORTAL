import express from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.js";
import {
  getPaymentRecords,
  createAllocation,
  addReceivedFund,
  addDirectExpense,
  addExpense,
  updateRecord,
  deleteRecord,
  deleteExpense,
  getFinancialReport,
} from "../controller/paymentRecord.controller.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
});

router.use(authenticate);

// --- Fetch & Report Routes ---
router.get("/", getPaymentRecords);
router.get("/report", getFinancialReport);

// --- Creation Routes ---
router.post("/allocate", upload.single("proof"), createAllocation);
router.post("/received", upload.single("proof"), addReceivedFund);
router.post("/direct-expense", upload.array("proofs", 5), addDirectExpense);
router.post("/:recordId/expense", upload.array("proofs", 5), addExpense);

// --- Update & Delete Routes ---
router.put("/:id", updateRecord);
router.delete("/:id", deleteRecord);
router.delete("/:recordId/expense/:expenseId", deleteExpense);

export default router;
