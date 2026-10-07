import express from "express";
import * as DeptCtrl from "../controller/department.controller.js";

const router = express.Router();

router.get("/", DeptCtrl.getAllDepartments);
router.get("/:id", DeptCtrl.getDepartmentById);
router.post("/", DeptCtrl.createDepartment);
router.put("/:id", DeptCtrl.updateDepartment);
router.delete("/:id", DeptCtrl.deleteDepartment);

export default router;
