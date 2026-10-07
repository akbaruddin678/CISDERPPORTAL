import express from 'express';
import {
  applyFine,
  getOverdueChallans,
  processOverdueChallans,
  payFine,
  waiveFine,
    getFineHistory
} from '../controller/fine.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateObjectIds } from '../middleware/validation.js';

const router = express.Router();

// router.use(authenticate);
// router.use(authorize('admin', 'accountant'));

router.post('/challans/:id/apply-fine', validateObjectIds(['id']), applyFine);
router.get('/overdue', getOverdueChallans);
router.post('/process-overdue', processOverdueChallans);
router.post('/challans/:id/pay-fine', validateObjectIds(['id']), payFine);
router.post('/challans/:id/waive-fine', validateObjectIds(['id']), waiveFine);
router.get('/history', getFineHistory);

export default router;