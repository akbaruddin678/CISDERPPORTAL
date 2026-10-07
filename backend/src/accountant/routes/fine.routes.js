import express from 'express';
import {
  applyFine,
  getOverdueChallans,
  processOverdueChallans,
  payFine,
  waiveFine,
    getFineHistory,
  getFineSettings,
  updateFineSettings
} from '../controller/fine.controller.js';
import { protect, requireRole } from '../../core/middleware/auth.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateObjectIds } from '../middleware/validation.js';

const router = express.Router();

// router.use(authenticate);
// router.use(authorize('admin', 'accountant'));

router.get('/settings', protect, requireRole('accountant', 'headofaccount', 'admin'), getFineSettings);
router.put('/settings', protect, requireRole('accountant', 'headofaccount', 'admin'), updateFineSettings);

router.post('/challans/:id/apply-fine', validateObjectIds(['id']), applyFine);
router.get('/overdue', getOverdueChallans);
router.post('/process-overdue', processOverdueChallans);
router.post('/challans/:id/pay-fine', validateObjectIds(['id']), payFine);
router.post('/challans/:id/waive-fine', validateObjectIds(['id']), waiveFine);
router.get('/history', getFineHistory);

export default router;