import express from "express";
import {
  generateChallan,
  autoGenerateByMonth,
  getChallans,
  getChallansByStudentId,
  markChallanPaid,
  deleteChallan,
  createInstallments,
  getChallanForPrint,
  updateChallanDueDate,
  getChallan,
  updateChallan,
  applyScholarshipToChallan,
  regenerateLateChallan,
  createGeneralChallan,
  convertToInstallment,
  applyDiscount,
  removeDiscount,
  bulkDeleteChallans,
  bulkRenewChallans,
  getOverdueInstallments,
  bulkUpdateDates,
  getChallansPaginated,
  getReports,
  getMonthlyFinanceReport,
  updateFineAndDueDate,
  bulkUpdateFineAndDueDate,
  triggerOverdueProcessing,
  getMasterFinancialReport,
  getStudentFinancialDossier, // ✅ NEW IMPORT
  getDailyInvoices,
  bulkShiftUnpaidInvoiceDueDate,
  bulkCancelUnpaidInvoices,
  getAutoGeneratePreview,
  getPreviousDuesSummary,
} from "../controller/studentChallan.controller.js";
import { validateObjectIds } from "../middleware/validation.js";
import { admissionUpload } from "../../core/middleware/upload.js";

const router = express.Router();

// ==========================================
// 1. BULK & STATIC ROUTES (MUST GO FIRST)
// ==========================================
router.post("/generate", generateChallan);
router.post("/bulk-generate", generateChallan);
router.get("/auto-generate/preview", getAutoGeneratePreview);
router.get("/overdue-installments", getOverdueInstallments);
router.post("/auto-generate", autoGenerateByMonth);
router.post("/trigger-overdue", triggerOverdueProcessing);
router.post("/generate-general", createGeneralChallan);
router.get("/previous-dues-summary", getPreviousDuesSummary);
router.get("/paginated", getChallansPaginated);
router.get("/reports", getReports);
router.get("/monthly-report", getMonthlyFinanceReport);
router.get("/", getChallans);
router.get("/student/:studentId", getChallansByStudentId);

// ✅ NEW ROUTE FOR FINANCIAL DOSSIER
router.get(
  "/student/:id/dossier",
  validateObjectIds(["id"]),
  getStudentFinancialDossier,
);

router.get("/master-report", getMasterFinancialReport);

router.post("/bulk-delete", bulkDeleteChallans);
router.post("/bulk-renew", bulkRenewChallans);
router.patch("/bulk-update-date", bulkUpdateDates);
router.patch("/bulk/fine-due-date", bulkUpdateFineAndDueDate);
router.post("/process-overdue", triggerOverdueProcessing);

// --- Daily Invoice (College) ---
router.get("/daily-invoice", getDailyInvoices);
router.post("/daily-invoice/bulk-shift-date", bulkShiftUnpaidInvoiceDueDate);
router.post("/daily-invoice/bulk-cancel", bulkCancelUnpaidInvoices);

// ==========================================
// 2. DYNAMIC ID ROUTES (MUST GO LAST)
// ==========================================
router.get("/:id", validateObjectIds(["id"]), getChallan);
router.get("/:id/print", validateObjectIds(["id"]), getChallanForPrint);

router.patch(
  "/:id/mark-paid",
  validateObjectIds(["id"]),
  admissionUpload.single("paymentProof"),
  markChallanPaid,
);

router.patch("/:id/due-date", validateObjectIds(["id"]), updateChallanDueDate);
router.patch(
  "/:id/apply-scholarship",
  validateObjectIds(["id"]),
  applyScholarshipToChallan,
);
router.patch(
  "/:id/regenerate",
  validateObjectIds(["id"]),
  regenerateLateChallan,
);
router.post(
  "/:id/create-installments",
  validateObjectIds(["id"]),
  createInstallments,
);
router.patch("/:id/discount", validateObjectIds(["id"]), applyDiscount);
router.delete("/:id/discount", validateObjectIds(["id"]), removeDiscount);
router.patch(
  "/:id/convert-to-installment",
  validateObjectIds(["id"]),
  convertToInstallment,
);
router.patch(
  "/:id/fine-due-date",
  validateObjectIds(["id"]),
  updateFineAndDueDate,
);
router.delete("/:id", validateObjectIds(["id"]), deleteChallan);
router.put("/:id", validateObjectIds(["id"]), updateChallan);

export default router;
