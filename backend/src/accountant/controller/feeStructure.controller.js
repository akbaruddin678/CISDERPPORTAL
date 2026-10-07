import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../middleware/errorHandler.js";
import { FeeManagementService } from "../services/feeStructure.service.js";

// ==========================================
// 1. FEE HEADS (Definitions)
// ==========================================
export const createFeeHead = asyncHandler(async (req, res) => {

  const result = await FeeManagementService.createFeeHead(req.body);
  res.status(201).json({ success: true, data: result });
});

export const getFeeHeads = asyncHandler(async (req, res) => {
  const result = await FeeManagementService.getFeeHeads(req.query);
  res.status(200).json({ success: true, count: result.length, data: result });
});

// ==========================================
// 2. ACADEMIC FEE (Tuition/Semester)
// ==========================================
export const createAcademicFee = asyncHandler(async (req, res) => {

  // Manual check for Total Amount if schema validation misses it
  if (!req.body.totalAmount) throw new AppError("Total Amount is required", 400);
  
  const result = await FeeManagementService.createAcademic(req.body);
  res.status(201).json({ success: true, message: "Semester Fee Created", data: result });
});

export const getAcademicFees = asyncHandler(async (req, res) => {
  const result = await FeeManagementService.getAcademic(req.query);
  res.status(200).json({ success: true, count: result.length, data: result });
});

export const updateAcademicFee = asyncHandler(async (req, res) => {
  const result = await FeeManagementService.updateAcademic(req.params.id, req.body);
  if (!result) throw new AppError("Record not found", 404);
  res.status(200).json({ success: true, message: "Updated Successfully", data: result });
});

export const deleteAcademicFee = asyncHandler(async (req, res) => {
  await FeeManagementService.deleteAcademic(req.params.id);
  res.status(200).json({ success: true, message: "Deleted Successfully" });
});

// ==========================================
// 2B. BASIC FEE (Per-Semester Baseline)
// ==========================================
export const createBasicFee = asyncHandler(async (req, res) => {
  if (!req.body.totalAmount) throw new AppError("Total Amount is required", 400);

  const result = await FeeManagementService.createBasic(req.body);
  res.status(201).json({ success: true, message: "Basic Semester Fee Created", data: result });
});

export const getBasicFees = asyncHandler(async (req, res) => {
  const result = await FeeManagementService.getBasic(req.query);
  res.status(200).json({ success: true, count: result.length, data: result });
});

export const updateBasicFee = asyncHandler(async (req, res) => {
  const result = await FeeManagementService.updateBasic(req.params.id, req.body);
  if (!result) throw new AppError("Record not found", 404);
  res.status(200).json({ success: true, message: "Updated Successfully", data: result });
});

export const deleteBasicFee = asyncHandler(async (req, res) => {
  await FeeManagementService.deleteBasic(req.params.id);
  res.status(200).json({ success: true, message: "Deleted Successfully" });
});

// ==========================================
// 3. ADMISSION FEE (One-Time)
// ==========================================
export const createAdmissionFee = asyncHandler(async (req, res) => {
  if (!req.body.totalAmount) throw new AppError("Total Amount is required", 400);
  
  const result = await FeeManagementService.createAdmission(req.body);
  res.status(201).json({ success: true, message: "Admission Fee Created", data: result });
});

export const getAdmissionFees = asyncHandler(async (req, res) => {
  const result = await FeeManagementService.getAdmission(req.query);
  res.status(200).json({ success: true, count: result.length, data: result });
});

export const updateAdmissionFee = asyncHandler(async (req, res) => {
  const result = await FeeManagementService.updateAdmission(req.params.id, req.body);
  if (!result) throw new AppError("Record not found", 404);
  res.status(200).json({ success: true, message: "Updated Successfully", data: result });
});

export const deleteAdmissionFee = asyncHandler(async (req, res) => {
  await FeeManagementService.deleteAdmission(req.params.id);
  res.status(200).json({ success: true, message: "Deleted Successfully" });
});

// ==========================================
// 4. RE-ADMISSION FEE
// ==========================================
export const createReAdmissionFee = asyncHandler(async (req, res) => {
  if (!req.body.totalAmount) throw new AppError("Total Amount is required", 400);

  const result = await FeeManagementService.createReAdmission(req.body);
  res.status(201).json({ success: true, message: "Re-Admission Fee Created", data: result });
});

export const getReAdmissionFees = asyncHandler(async (req, res) => {
  const result = await FeeManagementService.getReAdmission(req.query);
  res.status(200).json({ success: true, count: result.length, data: result });
});

export const updateReAdmissionFee = asyncHandler(async (req, res) => {
  const result = await FeeManagementService.updateReAdmission(req.params.id, req.body);
  if (!result) throw new AppError("Record not found", 404);
  res.status(200).json({ success: true, message: "Updated Successfully", data: result });
});

export const deleteReAdmissionFee = asyncHandler(async (req, res) => {
  await FeeManagementService.deleteReAdmission(req.params.id);
  res.status(200).json({ success: true, message: "Deleted Successfully" });
});

// ==========================================
// 5. EXAM FEE
// ==========================================
export const createExamFee = asyncHandler(async (req, res) => {
  if (!req.body.totalAmount) throw new AppError("Total Amount is required", 400);
  if (!req.body.levelNumber) throw new AppError("Level/Semester Number is required", 400);

  const result = await FeeManagementService.createExam(req.body);
  res.status(201).json({ success: true, message: "Exam Fee Created", data: result });
});

export const getExamFees = asyncHandler(async (req, res) => {
  const result = await FeeManagementService.getExam(req.query);
  res.status(200).json({ success: true, count: result.length, data: result });
});

export const updateExamFee = asyncHandler(async (req, res) => {
  const result = await FeeManagementService.updateExam(req.params.id, req.body);
  if (!result) throw new AppError("Record not found", 404);
  res.status(200).json({ success: true, message: "Updated Successfully", data: result });
});

export const deleteExamFee = asyncHandler(async (req, res) => {
  await FeeManagementService.deleteExam(req.params.id);
  res.status(200).json({ success: true, message: "Deleted Successfully" });
});

// ==========================================
// 6. MISCELLANEOUS FEE (General)
// ==========================================
export const createMiscellaneousFee = asyncHandler(async (req, res) => {
  console.log(req.body)
  if (!req.body.amount) throw new AppError("Amount is required", 400);
  
  const result = await FeeManagementService.createMisc(req.body);
  res.status(201).json({ success: true, message: "Misc Fee Saved", data: result });
});

export const getMiscellaneousFees = asyncHandler(async (req, res) => {
  const result = await FeeManagementService.getMisc();
  res.status(200).json({ success: true, count: result.length, data: result });
});

export const deleteMiscellaneousFee = asyncHandler(async (req, res) => {
  await FeeManagementService.deleteMisc(req.params.id);
  res.status(200).json({ success: true, message: "Deleted Successfully" });
});