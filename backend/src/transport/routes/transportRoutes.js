import express from "express";
import * as Ctrl from "../controllers/transport.controller.js";
const router = express.Router();

router.post("/vehicles", Ctrl.createVehicle);
router.get("/vehicles", Ctrl.getVehicles);
router.post("/drivers", Ctrl.createDriver);
router.get("/drivers", Ctrl.getDrivers);
router.post("/routes", Ctrl.createRoute);
router.get("/routes", Ctrl.getRoutes);

router.post("/assign", Ctrl.allocateTransport);
router.get("/allocations", Ctrl.getAllocations);
router.put("/vacate/:id", Ctrl.vacateTransport);

router.post("/generate-challan", Ctrl.generateBulkChallan);
router.get("/challans", Ctrl.getChallans);
router.get("/stats", Ctrl.getStats);

export default router;
