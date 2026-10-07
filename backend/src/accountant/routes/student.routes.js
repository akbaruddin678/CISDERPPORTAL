import express from 'express';
import {
  getStudents,
  getStudentDetails,
  getStudentsForChallan,
  getStudentsByProgram,
  getStudentAcademicInfo,
  validateStudentsForChallan,
  updateAdmissionReviewStatus,
  getChallanStatusBatch,
  getAdmissionChallanStatusBatch,
  getScholarshipStatusBatch,
  getNewAdmissionsSummary,
  reAdmitStudent
} from '../controller/student.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateObjectIds } from '../middleware/validation.js';

const router = express.Router();

// router.use(authenticate);

// Get all students with filtering and pagination
router.get('/', getStudents);

// Batch Challan/Payment status lookup (Not Generated/Pending/Paid/Overdue)
// for a set of student IDs — used by both the Admission module's own list
// and the accountant's "New Admission" list. Must come before the `/:id`
// catch-all below.
router.get('/challan-status', getChallanStatusBatch);

// Same as above, but scoped to only the admission-fee challan — used by
// the Admission Process pipeline (Accepted/Challan Generated/Fee Paid/Fee
// Overdue buckets). Must also come before the `/:id` catch-all below.
router.get('/admission-challan-status', getAdmissionChallanStatusBatch);

// Batch "active scholarship" lookup (hasScholarship + scholarshipName) for
// a set of student IDs — used by the Student Directory export. Must also
// come before the `/:id` catch-all below.
router.get('/scholarship-status', getScholarshipStatusBatch);

// College/University new-admission challan breakdown + last-2-days count —
// must also come before the `/:id` catch-all below.
router.get('/new-admissions-summary', getNewAdmissionsSummary);

// Get students specifically for challan generation
router.get('/for-challan', getStudentsForChallan);

// Get students by program
router.get('/program/:programId', validateObjectIds(['programId']), getStudentsByProgram);

// Validate students for challan generation
router.post('/validate-for-challan', validateStudentsForChallan);

// Get student academic information
router.get('/:id/academic-info', validateObjectIds(['id']), getStudentAcademicInfo);

// Mark a new admission as reviewed/completed (or back to pending) — a write,
// so this one is authenticated even though the reads above currently aren't.
router.patch(
  '/:id/admission-review-status',
  validateObjectIds(['id']),
  authenticate,
  authorize('admin', 'accountant'),
  updateAdmissionReviewStatus,
);

// Manually re-admit a student previously auto-cancelled for non-payment —
// reactivates the same record, never creates a new one.
router.patch(
  '/:id/re-admit',
  validateObjectIds(['id']),
  authenticate,
  authorize('admin', 'accountant'),
  reAdmitStudent,
);

// Get student details (must be last)
router.get('/:id', getStudentDetails);

export default router;