import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  getMe,
  getCandidates,
  getEligibility,
  startClearance,
  startClearanceBulk,
  bulkAction,
  listClearances,
  listGraduates,
  getClearance,
  submitHod,
  approveExam,
  rejectExam,
  approveOffice,
  rejectOffice,
  approveFinance,
  rejectFinance,
  finalizeClearance,
  rejectRegistrar,
  cancelClearance,
  listOffices,
  createOffice,
  updateOffice,
  searchOfficerCandidates,
} from "../controller/graduationController.js";

const router = express.Router();

// Coarse gate: only roles that hold some desk in the clearance flow get in.
// Which desk (and which department / office) is decided per action in the
// controller, from the DB user — never from anything the client sends.
router.use(
  protect,
  requireRole(
    "admin",
    "hod",
    "registrar",
    "manager",
    "exam",
    "accountant",
    "library",
    "transport",
    "hostel",
    "it_labs",
    "clearance_officer",
  ),
);

// Static paths first so they aren't captured by "/:id".
router.get("/me", getMe);
router.get("/candidates", getCandidates);
router.get("/graduates", listGraduates);
router.get("/students/:studentId/eligibility", getEligibility);

router.get("/offices", listOffices);
router.post("/offices", createOffice);
router.get("/offices/officer-search", searchOfficerCandidates);
router.patch("/offices/:id", updateOffice);

router.get("/", listClearances);
router.post("/", startClearance);
router.post("/bulk", startClearanceBulk);
router.post("/bulk-action", bulkAction);
router.get("/:id", getClearance);

router.post("/:id/hod/submit", submitHod);
router.post("/:id/exam/approve", approveExam);
router.post("/:id/exam/reject", rejectExam);
router.post("/:id/offices/:officeKey/approve", approveOffice);
router.post("/:id/offices/:officeKey/reject", rejectOffice);
router.post("/:id/finance/approve", approveFinance);
router.post("/:id/finance/reject", rejectFinance);
router.post("/:id/registrar/finalize", finalizeClearance);
router.post("/:id/registrar/reject", rejectRegistrar);
router.post("/:id/cancel", cancelClearance);

export default router;
