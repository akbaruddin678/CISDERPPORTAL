import express from "express";
import * as SemesterCtrl from "../controller/semester.controller.js";

const router = express.Router();

router.get("/", SemesterCtrl.getAllSemesters);
router.get("/program/:programId", SemesterCtrl.getSemestersByProgram);
router.get("/:id/usage", SemesterCtrl.getSemesterUsage);
router.get("/:id", SemesterCtrl.getSemesterById);
router.post("/", SemesterCtrl.createSemester);
router.put("/:id", SemesterCtrl.updateSemester);
router.patch("/:id/toggle-status", SemesterCtrl.toggleSemesterStatus);
router.delete("/:id", SemesterCtrl.deleteSemester);

export default router;
