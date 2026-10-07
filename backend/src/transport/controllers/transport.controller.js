import { asyncHandler } from "../../accountant/middleware/asyncHandler.js";
import { TransportService } from "../services/transport.service.js";

// Setup
export const createVehicle = asyncHandler(async(req,res) => res.json({ success: true, data: await TransportService.createVehicle(req.body) }));
export const getVehicles = asyncHandler(async(req,res) => res.json({ success: true, data: await TransportService.getVehicles() }));
export const createDriver = asyncHandler(async(req,res) => res.json({ success: true, data: await TransportService.createDriver(req.body) }));
export const getDrivers = asyncHandler(async(req,res) => res.json({ success: true, data: await TransportService.getDrivers() }));
export const createRoute = asyncHandler(async(req,res) => res.json({ success: true, data: await TransportService.createRoute(req.body) }));
export const getRoutes = asyncHandler(async(req,res) => res.json({ success: true, data: await TransportService.getRoutes() }));

// Allocation
export const allocateTransport = asyncHandler(async(req,res) => res.status(201).json({ success: true, message: "Assigned", data: await TransportService.allocateTransport(req.body) }));
export const getAllocations = asyncHandler(async(req,res) => res.json({ success: true, data: await TransportService.getAllocations() }));
export const vacateTransport = asyncHandler(async(req,res) => { await TransportService.vacateTransport(req.params.id); res.json({ success: true, message: "Vacated" }); });

// Challan & Stats
export const generateBulkChallan = asyncHandler(async(req,res) => { await TransportService.generateBulkChallan(req.body); res.json({ success: true, message: "Generated" }); });
export const getChallans = asyncHandler(async(req,res) => res.json({ success: true, data: await TransportService.getChallans() }));
export const getStats = asyncHandler(async(req,res) => res.json({ success: true, data: await TransportService.getStats() }));