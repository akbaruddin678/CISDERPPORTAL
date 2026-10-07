import mongoose from "mongoose";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

// --- Models ---
import StudentProfile from "../../student/models/StudentProfile.js";
import StudentChallan from "../../accountant/model/StudentChallan.js";

// GET /api/admissions/challans/latest/:userId
export const getLatestChallan = asyncHandler(async (req, res) => {
  const { userId: paramId } = req.params;



  // 1. Validation
  if (!mongoose.isValidObjectId(paramId)) {
  
    return res.status(400).json({ error: "Invalid ID parameter" });
  }

  // 2. Collect ALL possible IDs this challan could be attached to.
  const possibleIds = [paramId];

  // 3. Check if a StudentProfile actually exists for this user
  const studentProfile = await StudentProfile.findOne({
    $or: [
      { _id: paramId },
      { userId: paramId },
      { createdFromApplicationId: paramId },
    ],
  });

  if (studentProfile) {
  
    possibleIds.push(studentProfile._id.toString());
  } 

  
  // 4. Search Challans using the array of all possible IDs
  const admissionChallan = await StudentChallan.findOne({
    studentId: { $in: possibleIds },
    isDeleted: false,
    status: { $ne: "cancelled" },
   
    challanType: { $regex: "admission", $options: "i" },
  })
    .populate("programId", "name")
    .populate("departmentId", "name")
    .populate("termId", "name")
    .sort({ createdAt: -1 })
    .lean();

  if (!admissionChallan) {
   
    return res.json({ success: true, data: null });
  }



  // 5. Format Response for the UI
  const formattedData = {
    _id: admissionChallan._id,
    challanNo: admissionChallan.challanNo,

    // Type info
    challanType: admissionChallan.challanType,
    type: admissionChallan.challanType || "Admission Fee",

    feeDetails: admissionChallan.feeDetails || {},

    // Financial Totals
    originalTotal: admissionChallan.originalTotal || admissionChallan.netAmount,
    netAmount: admissionChallan.netAmount,
    amount: admissionChallan.netAmount,
    remainingAmount: admissionChallan.remainingAmount,

    // Adjustments
    arrears: admissionChallan.arrears || 0,
    fineAmount: admissionChallan.fineAmount || 0,
    scholarshipAmount: admissionChallan.scholarshipAmount || 0,
    discountAmount: admissionChallan.discountAmount || 0,
    discountReason: admissionChallan.discountReason || "",

    // Status & Dates
    status: admissionChallan.status,
    dueDate: admissionChallan.dueDate,
    createdAt: admissionChallan.createdAt,
    updatedAt: admissionChallan.updatedAt,

    paymentReference: admissionChallan.paymentReference,
    transactionRef: admissionChallan.transactionRef || null,

    programId: admissionChallan.programId,
    departmentId: admissionChallan.departmentId,
    termId: admissionChallan.termId,
  };

  res.json({
    success: true,
    data: formattedData,
  });
});
