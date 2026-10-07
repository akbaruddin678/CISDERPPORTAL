import express from 'express';
import {
  createInstallmentPlan,
  getInstallmentPlans,
  assignInstallment,
  getStudentInstallments,
  getInstallmentPlan,
  updateInstallmentPlan,
  getAssignmentDetails,
  updateInstallmentPayment,
  removeInstallmentAssignment,
  getOverdueInstallments,
  saveStudentPreferences,
  getStudentPreference,
  assignPreferenceSemester,
  getStudentPreferenceHistory,
  getBatchInstallmentStatus,
  generateSpecificInstallment
} from "../controller/installment.controller.js";
import { authenticate, authorize } from '../middleware/auth.js';
import { validateObjectIds, requireFields } from '../middleware/validation.js';

const router = express.Router();

// router.use(authenticate);
// router.use(authorize('admin', 'accountant'));

// --- Static Routes First ---
router.post('/plans', createInstallmentPlan);
router.get('/plans', getInstallmentPlans); // 👈 This must come before /plans/:id
router.post('/assign', assignInstallment);
router.get('/overdue-installments', getOverdueInstallments);

// --- Dynamic Routes Second ---
router.get('/student/:studentId', getStudentInstallments);
router.get('/plans/:id', validateObjectIds(['id']), getInstallmentPlan); 
router.post('/assignments/:assignmentId/generate/:installmentNumber', generateSpecificInstallment);
router.put('/plans/:id', validateObjectIds(['id']), updateInstallmentPlan);

router.get('/assignments/:assignmentId', validateObjectIds(['assignmentId']), getAssignmentDetails);
router.patch('/assignments/:assignmentId/installments/:installmentNumber/pay', updateInstallmentPayment);
router.delete('/assignments/:assignmentId', validateObjectIds(['assignmentId']), removeInstallmentAssignment);
router.get("/preferences", getStudentPreference);
router.patch(
  "/preferences/:id/assign-semester",
  validateObjectIds(["id"]),
  assignPreferenceSemester,
);
router.get("/preferences/history/:studentId", getStudentPreferenceHistory);
router.post("/preferences/batch-status", getBatchInstallmentStatus);
router.post("/preferences", saveStudentPreferences);
export default router;