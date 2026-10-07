import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryStats,
  getInventoryAssignments,
  assignInventoryItem,
  returnInventoryItem,
  getInventoryLocationTree,
} from "../controller/inventoryController.js";

const router = express.Router();
router.use(protect, requireRole("hr", "admin"));

router.get("/stats", getInventoryStats);
router.get("/locations", getInventoryLocationTree);

router.get("/items", getInventoryItems);
router.get("/items/:id", getInventoryItemById);
router.post("/items", createInventoryItem);
router.put("/items/:id", updateInventoryItem);
router.delete("/items/:id", deleteInventoryItem);

router.get("/assignments", getInventoryAssignments);
router.post("/assignments", assignInventoryItem);
router.patch("/assignments/:id/return", returnInventoryItem);

export default router;
