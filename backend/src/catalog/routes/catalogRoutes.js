import express from "express";
import departmentRoutes from "./department.routes.js";
import programRoutes from "./program.routes.js";
import termRoutes from "./term.routes.js";
import semesterRoutes from "./semester.routes.js";
import { getCompleteCatalog } from "../controller/catalog.controller.js";

const router = express.Router();

// Mount individual entity routes
router.use("/departments", departmentRoutes);
router.use("/programs", programRoutes);
router.use("/terms", termRoutes);
router.use("/semesters", semesterRoutes);


// Global dashboard/catalog route
router.get("/complete", getCompleteCatalog);

export default router;
