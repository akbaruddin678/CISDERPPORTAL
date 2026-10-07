import { StudentLeftService } from "../services/studentLeft.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import { uploadToR2 } from "../../core/utils/cloudflareR2.js";

// @desc    Mark a student as Left/Withdrawn and cancel unpaid challans
// @route   PUT /api/students/:id/leave
export const processStudentLeft = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const adminId = req.user._id;

  if (!reason) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide a reason." });
  }

  let proofUrl = null;
  if (req.file) {
    proofUrl = await uploadToR2(req.file, "left_cases");
    
  }

  const result = await StudentLeftService.processStudentLeft(
    req.params.id,
    reason,
    adminId,
    proofUrl,
  );

  res.status(200).json({
    success: true,
    message: "Student marked as withdrawn. Unpaid challans safely cancelled.",
    data: result,
  });
});

// @desc    Update reason/proof for a student who already left
// @route   PATCH /api/students/:id/leave/update
export const updateLeftStudentDetails = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const student = await StudentProfile.findById(req.params.id);
  if (!student) {
    return res
      .status(404)
      .json({ success: false, message: "Student not found" });
  }

  if (reason) student.remark = reason;

  if (req.file) {
    const proofUrl = await uploadToR2(req.file, "left_cases");
  

    // ✅ FIX: Force Mongoose to save the URL even if it's not in the strict schema
    student.set("proofDocument", proofUrl, { strict: false });
  }

  await student.save();

  res.status(200).json({
    success: true,
    message: "Withdrawal details updated successfully.",
    data: student,
  });
});

export const getLeftStudentsList = asyncHandler(async (req, res) => {
  const students = await StudentLeftService.getLeftStudentsList(req.query);
  res
    .status(200)
    .json({ success: true, count: students.length, data: students });
});

export const getLeftStudentsStats = asyncHandler(async (req, res) => {
  const stats = await StudentLeftService.getLeftStudentsStats(
    req.query.departmentId,
  );
  res.status(200).json({ success: true, data: stats });
});
