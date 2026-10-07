import express from "express";
import { protect, requireRole } from "../../core/middleware/auth.js";
import { getRooms, createRoom, updateRoom } from "../controller/roomController.js";

const router = express.Router();
router.use(protect);

// Reads: same scoping as timetableRoutes.js's read access — Registrar/Admin
// see everything, HOD/Exam staff can browse rooms while scheduling/reading.
router.get("/", requireRole("registrar", "admin", "hod", "manager"), getRooms);

// Writes: only Registrar/Admin create or edit the physical room catalog.
router.post("/", requireRole("registrar", "admin"), createRoom);
router.patch("/:id", requireRole("registrar", "admin"), updateRoom);

export default router;
