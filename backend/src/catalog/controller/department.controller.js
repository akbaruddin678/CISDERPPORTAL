import { asyncHandler } from "../../core/utils/asyncHandler.js";
import Department from "../model/Department.js";

export const getAllDepartments = asyncHandler(async (req, res) => {
  const items = await Department.find()
    .populate("headOfDepartment", "fullName email")
    .select("_id name code headOfDepartment")
    .lean();
  res.status(200).json({ success: true, count: items.length, data: items });
});

export const getDepartmentById = asyncHandler(async (req, res) => {
  const dept = await Department.findById(req.params.id).populate(
    "headOfDepartment",
  );
  if (!dept)
    return res
      .status(404)
      .json({ success: false, error: "Department not found" });
  res.status(200).json({ success: true, data: dept });
});

export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, headOfDepartment } = req.body;
  const existing = await Department.findOne({ code: code.toUpperCase() });
  if (existing)
    return res
      .status(409)
      .json({ success: false, error: "Department code already exists" });

  const dept = await Department.create({
    name,
    code: code.toUpperCase(),
    headOfDepartment,
  });
  res
    .status(201)
    .json({ success: true, message: "Department created", data: dept });
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!dept)
    return res
      .status(404)
      .json({ success: false, error: "Department not found" });
  res
    .status(200)
    .json({ success: true, message: "Department updated", data: dept });
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findByIdAndDelete(req.params.id);
  if (!dept)
    return res
      .status(404)
      .json({ success: false, error: "Department not found" });
  res.status(200).json({ success: true, message: "Department deleted" });
});
