import { asyncHandler } from "../middleware/asyncHandler.js";
import { StudentFeeService } from "../services/studentFee.service.js";


export const upsertStudentFee = asyncHandler(async (req, res) => {
  const result = await StudentFeeService.upsertStudentFee(
    req.body,
    req.user?._id,
  );
  res
    .status(200)
    .json({ success: true, message: "Saved Successfully", data: result });
});


export const bulkCreateStudentFees = asyncHandler(async (req, res) => {
  const result = await StudentFeeService.bulkCreateStudentFees(
    req.body,
    req.user?._id,
  );
  res
    .status(200)
    .json({
      success: true,
      message: `Fee assigned to ${result.length} students`,
      data: result,
    });
});


export const getStudentFees = asyncHandler(async (req, res) => {
  const fees = await StudentFeeService.getStudentFees(req.params.studentId);
  res.json({ success: true, data: fees });
});
export const deleteStudentFee = asyncHandler(async (req, res) => {
  await StudentFeeService.deleteStudentFee(req.params.id);
  res.json({ success: true, message: "Deleted" });
});

export const assignFeeSemester = asyncHandler(async (req, res) => {
  const { semesterId } = req.body;
  if (!semesterId) {
    return res
      .status(400)
      .json({ success: false, message: "semesterId is required" });
  }
  const result = await StudentFeeService.assignSemester(
    req.params.id,
    semesterId,
  );
  res
    .status(200)
    .json({ success: true, message: "Semester assigned", data: result });
});
