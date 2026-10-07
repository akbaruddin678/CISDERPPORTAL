import express from "express";
import * as HostelCtrl from "../controller/hostelAllocation.controller.js";
import { validateObjectIds } from "../../accountant/middleware/validation.js";

const router = express.Router();

// --- Static & Stats Routes ---
router.get("/hostel/allocations", HostelCtrl.getAllocations);
router.get("/hostel/challans", HostelCtrl.getHostelChallans);
router.get("/hostel/stats", HostelCtrl.getStats);

// --- Generation & Sync ---
router.post("/hostel/assign", HostelCtrl.assignHostel);
router.post("/hostel/generate-challan", HostelCtrl.generateBulkChallan);
router.post("/hostel/sync-existing", HostelCtrl.syncExistingHostelChallans);

// --- Update & Deletion Routes ---
router.patch(
  "/hostel/allocation/:id",
  validateObjectIds(["id"]),
  HostelCtrl.updateAllocation,
); 
router.put(
  "/hostel/vacate/:id",
  validateObjectIds(["id"]),
  HostelCtrl.vacateHostel,
);

export default router;
