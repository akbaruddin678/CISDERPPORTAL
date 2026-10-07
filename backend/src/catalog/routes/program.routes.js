import express from "express";
import * as ProgramCtrl from "../controller/program.controller.js";

const router = express.Router();

router.get("/", ProgramCtrl.getAllPrograms);
router.get("/department/:departmentId", ProgramCtrl.getProgramsByDepartment);
router.get("/:id", ProgramCtrl.getProgramById);
router.post("/", ProgramCtrl.createProgram);
router.put("/:id", ProgramCtrl.updateProgram);
router.patch("/:id/toggle-status", ProgramCtrl.toggleProgramStatus);
router.delete("/:id", ProgramCtrl.deleteProgram);

export default router;
